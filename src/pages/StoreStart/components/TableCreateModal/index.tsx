import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type { AllTableListResponse } from '@/api/table/entity';
import AddTableIcon from '@/assets/icons/add-table.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useCreateAllTable } from '@/pages/StoreStart/hooks/useCreateAllTable';
import { useUpdateTableQrImages } from '@/pages/StoreStart/hooks/useUpdateTableQrImages';
import { MESSAGES, REGEX } from '@/static/validation';
import { usePresignedUploader } from '@/utils/hooks/usePresignedUploader';
import styles from './TableCreateModal.module.scss';

const QR_IMAGE_SIZE = 256;
const QR_S3_DIRECTORY = 'tables';

const createQrSvgMarkup = (value: string) => {
  return `<?xml version="1.0" encoding="UTF-8"?>${renderToStaticMarkup(
    <QRCodeSVG value={value} size={QR_IMAGE_SIZE} level="M" includeMargin />,
  )}`;
};

const createQrFileName = (storeId: number, tableId: number) => {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `table-${storeId}-${tableId}-${uuid}.svg`;
};

interface TableCreateModalProps {
  storeId?: number;
  onCreated?: (tables: AllTableListResponse, layout: { columns: number; rows: number }) => void;
  name: string;
  hasActiveOrders?: boolean;
  onReset?: () => void;
}

interface TableCreateForm {
  tableCount: string;
  tableColumns: string;
  tableRows: string;
}

export default function TableCreateModal({
  storeId,
  onCreated,
  name,
  hasActiveOrders = false,
  onReset,
}: TableCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createAllTables, isPending } = useCreateAllTable();
  const { mutateAsync: updateTableQrImages } = useUpdateTableQrImages(storeId ?? 0);
  const { upload } = usePresignedUploader();

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<TableCreateForm>({
    mode: 'onChange',
    defaultValues: {
      tableCount: '',
      tableColumns: '',
      tableRows: '',
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      reset({
        tableCount: '',
        tableColumns: '',
        tableRows: '',
      });
    }
  };

  const handleSubmitForm: SubmitHandler<TableCreateForm> = async (data) => {
    if (!storeId) return;

    try {
      const tableCount = Number(data.tableCount);
      const tableColumns = Number(data.tableColumns);
      const tableRows = Number(data.tableRows);

      if (tableCount <= 0 || tableColumns <= 0 || tableRows <= 0 || tableColumns * tableRows !== tableCount) {
        toast({
          message: '테이블 수를 다시 확인해 주세요.',
          variant: 'error',
        });
        return;
      }

      setIsUploadingQr(true);
      const tables = await createAllTables({
        storeId,
        count: tableCount,
      });

      const response = await Promise.all(
        tables.map(async (table) => {
          if (!table.qrUrl) {
            throw new Error('Missing QR URL.');
          }
          const svgMarkup = createQrSvgMarkup(table.qrUrl);
          const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml' });
          const imageUrl = await upload({
            directory: QR_S3_DIRECTORY,
            fileName: createQrFileName(storeId, table.tableNum),
            file: svgBlob,
            contentType: 'image/svg+xml',
            errorMessage: 'Failed to upload QR image.',
          });

          return {
            ...table,
            qrImageUrl: imageUrl,
          };
        }),
      );

      // TODO: Handle partial failures and retries once backend supports recovery flow.
      await updateTableQrImages({
        updates: response.map((table) => ({
          tableId: table.id,
          qrImage: table.qrImageUrl,
        })),
      });
      await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });
      onCreated?.(response, { columns: tableColumns, rows: tableRows });
      toast({
        message: '테이블이 생성되었습니다.',
        variant: 'info',
      });
      setOpen(false);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const errorMessage =
        status === 400
          ? '잘못된 요청입니다.'
          : status === 401
            ? '인증이 필요합니다.'
            : status === 403
              ? '본인 매장이 아닙니다.'
              : '테이블 생성에 실패했습니다.';

      toast({
        message: errorMessage,
        variant: 'error',
      });
      console.error('Failed to create table', error);
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleResetTables = () => {
    if (!storeId) return;
    if (hasActiveOrders) {
      toast({
        message: '주문이 있는 테이블이 있어 초기화할 수 없습니다.',
        variant: 'error',
      });
      return;
    }
    if (name === '테이블 추가') {
      toast({
        message: '테이블이 존재해야 초기화할 수 있습니다.',
        variant: 'error',
      });
      return;
    }
    if (onReset) {
      onReset();
      return;
    }
    toast({
      message: '초기화 기능은 준비 중입니다.',
      variant: 'info',
    });
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button className={styles.triggerButton} size="md" disabled={!storeId}>
          <AddTableIcon className={styles.triggerIcon} aria-hidden="true" />
          {name}
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>{name}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <ModalBody>
            <div className={styles.form}>
              <Input
                label="테이블 수"
                required
                message={errors.tableCount?.message}
                messageState={errors.tableCount ? 'error' : undefined}
              >
                <Input.Text
                  type="text"
                  inputMode="numeric"
                  placeholder="숫자만 입력하세요."
                  {...register('tableCount', {
                    required: '테이블 수를 입력해 주세요.',
                    pattern: {
                      value: REGEX.NUMBER_ONLY,
                      message: MESSAGES.MENU.NUMBER_ONLY,
                    },
                  })}
                />
              </Input>
              <Input
                label="테이블 열 (가로)"
                required
                message={errors.tableColumns?.message}
                messageState={errors.tableColumns ? 'error' : undefined}
              >
                <Input.Text
                  type="text"
                  inputMode="numeric"
                  placeholder="숫자만 입력하세요."
                  {...register('tableColumns', {
                    required: '테이블 열을 입력해 주세요.',
                    pattern: {
                      value: REGEX.NUMBER_ONLY,
                      message: MESSAGES.MENU.NUMBER_ONLY,
                    },
                  })}
                />
              </Input>
              <Input
                label="테이블 행 (세로)"
                required
                message={errors.tableRows?.message}
                messageState={errors.tableRows ? 'error' : undefined}
              >
                <Input.Text
                  type="text"
                  inputMode="numeric"
                  placeholder="숫자만 입력하세요."
                  {...register('tableRows', {
                    required: '테이블 행을 입력해 주세요.',
                    pattern: {
                      value: REGEX.NUMBER_ONLY,
                      message: MESSAGES.MENU.NUMBER_ONLY,
                    },
                  })}
                />
              </Input>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              size="md"
              fullWidth
              disabled={!isValid || isSubmitting || isUploadingQr}
              isLoading={isPending || isUploadingQr}
            >
              {name}
            </Button>
            <Button
              type="button"
              size="md"
              variant="danger"
              fullWidth
              disabled={isSubmitting || isPending || isUploadingQr}
              onClick={handleResetTables}
            >
              초기화
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
