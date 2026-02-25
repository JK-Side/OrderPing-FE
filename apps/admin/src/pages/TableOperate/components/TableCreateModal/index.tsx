import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import type { AllTableListResponse, TableResponse } from '@/api/table/entity';
import AddTableIcon from '@/assets/icons/add-table.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useCreateAllTable } from '@/pages/TableOperate/hooks/useCreateAllTable';
import { useUpdateTableQrImage } from '@/pages/TableOperate/hooks/useUpdateTableQrImage';
import { useUpdateTableQrImages } from '@/pages/TableOperate/hooks/useUpdateTableQrImages';
import { MESSAGES, REGEX } from '@/static/validation';
import { usePresignedUploader } from '@/utils/hooks/usePresignedUploader';
import styles from './TableCreateModal.module.scss';

const QR_IMAGE_SIZE = 256;
const QR_S3_DIRECTORY = 'tables';

type QrUploadTarget = {
  id: number;
  storeId: number;
  tableNum: number;
};

type QrUploadEntry = QrUploadTarget & {
  qrImageUrl?: string;
};

type QrUploadEntryWithImage = QrUploadEntry & {
  qrImageUrl: string;
};

const createQrSvgMarkup = (value: string) => {
  return `<?xml version="1.0" encoding="UTF-8"?>${renderToStaticMarkup(
    <QRCodeSVG value={value} size={QR_IMAGE_SIZE} level="M" includeMargin />,
  )}`;
};

const createQrValue = (tableNum: number) => {
  const baseUrl = import.meta.env.VITE_CUSTOMER_URL || 'http://localhost:5173';
  const url = new URL(`/tables/${tableNum}`, baseUrl);

  return url.toString();
};

const createQrFileName = (storeId: number, tableId: number) => {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `table-${storeId}-${tableId}-${uuid}.svg`;
};

const buildRetryMessage = (uploadFailureCount: number, updateFailureCount: number) => {
  if (uploadFailureCount > 0 && updateFailureCount === 0) {
    return `${uploadFailureCount}개의 QR 업로드가 실패했습니다.`;
  }
  if (uploadFailureCount === 0 && updateFailureCount > 0) {
    return `${updateFailureCount}개의 QR 등록이 실패했습니다.`;
  }
  return `${uploadFailureCount + updateFailureCount}개의 QR 업로드/등록이 실패했습니다.`;
};

const resolveErrorMessage = (error: unknown) => {
  const status = (error as { status?: number })?.status;
  return status === 400
    ? '잘못된 요청입니다.'
    : status === 401
      ? '인증이 필요합니다.'
      : status === 403
        ? '본인 매장이 아닙니다.'
        : '테이블 생성에 실패했습니다.';
};

interface TableCreateModalProps {
  storeId?: number;
  onCreated?: (tables: AllTableListResponse, layout: { columns: number; rows: number }) => void;
  onLayoutSaved?: (layout: { columns: number; rows: number }) => void;
  name: string;
  hasActiveOrders?: boolean;
  onReset?: () => void;
  mode?: 'create' | 'edit';
  tables?: TableResponse[];
  initialValues?: {
    tableCount: number;
    tableColumns: number;
    tableRows: number;
  } | null;
}

interface TableCreateForm {
  tableCount: string;
  tableColumns: string;
  tableRows: string;
}

export default function TableCreateModal({
  storeId,
  onCreated,
  onLayoutSaved,
  name,
  hasActiveOrders = false,
  onReset,
  mode = 'create',
  tables: existingTables = [],
  initialValues = null,
}: TableCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  const [retryEntries, setRetryEntries] = useState<QrUploadEntry[]>([]);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createAllTables, isPending } = useCreateAllTable();
  const { mutateAsync: updateTableQrImage, isPending: isUpdatingTableQrImage } = useUpdateTableQrImage();
  const { mutateAsync: updateTableQrImages } = useUpdateTableQrImages(storeId ?? 0);
  const { upload } = usePresignedUploader();

  const {
    register,
    reset,
    control,
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

  const getInitialFormValues = (): TableCreateForm => {
    if (!initialValues) {
      return {
        tableCount: '',
        tableColumns: '',
        tableRows: '',
      };
    }

    return {
      tableCount: String(initialValues.tableCount),
      tableColumns: String(initialValues.tableColumns),
      tableRows: String(initialValues.tableRows),
    };
  };

  const watchedTableColumns = useWatch({ control, name: 'tableColumns' });
  const watchedTableRows = useWatch({ control, name: 'tableRows' });
  const isLayoutUnchanged =
    mode === 'edit' &&
    !!initialValues &&
    Number(watchedTableColumns) === initialValues.tableColumns &&
    Number(watchedTableRows) === initialValues.tableRows;

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);
    if (nextOpen) {
      reset(getInitialFormValues());
      setRetryEntries([]);
      setRetryMessage(null);
      setIsUploadingQr(false);
    }
  };

  const uploadQrImages = async (targets: QrUploadTarget[]) => {
    const results = await Promise.allSettled(
      targets.map(async (table) => {
        const qrValue = createQrValue(table.tableNum);
        const svgMarkup = createQrSvgMarkup(qrValue);
        const svgBlob = new Blob([svgMarkup], { type: 'image/svg+xml' });
        const imageUrl = await upload({
          directory: QR_S3_DIRECTORY,
          fileName: createQrFileName(table.storeId, table.tableNum),
          file: svgBlob,
          contentType: 'image/svg+xml',
          errorMessage: 'QR 이미지 업데이트에 실패했습니다.',
        });

        return {
          ...table,
          qrImageUrl: imageUrl,
        };
      }),
    );

    const succeeded: QrUploadEntryWithImage[] = [];
    const failed: QrUploadEntry[] = [];

    results.forEach((result, index) => {
      const table = targets[index];
      if (result.status === 'fulfilled') {
        succeeded.push(result.value);
      } else {
        failed.push({ ...table });
      }
    });

    return { succeeded, failed };
  };

  const updateQrImages = async (entries: QrUploadEntryWithImage[]) => {
    if (entries.length === 0) return [] as QrUploadEntryWithImage[];

    try {
      await updateTableQrImages({
        updates: entries.map((table) => ({
          tableId: table.id,
          qrImageUrl: table.qrImageUrl,
        })),
      });
      return [] as QrUploadEntryWithImage[];
    } catch (error) {
      console.error('QR 이미지 업데이트에 실패했습니다.', error);
      return entries;
    }
  };

  const updateQrImagesByTable = async (entries: QrUploadEntryWithImage[]) => {
    if (entries.length === 0) return [] as QrUploadEntryWithImage[];

    const results = await Promise.allSettled(
      entries.map((table) =>
        updateTableQrImage({
          tableId: table.id,
          body: {
            qrImageUrl: table.qrImageUrl,
          },
        }),
      ),
    );

    const failed: QrUploadEntryWithImage[] = [];
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        failed.push(entries[index]);
      }
    });

    return failed;
  };

  const handleSubmitForm: SubmitHandler<TableCreateForm> = async (data) => {
    if (!storeId) return;
    if (retryEntries.length > 0) return;

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

      if (mode === 'edit') {
        const sortedTables = [...existingTables].sort((a, b) => a.tableNum - b.tableNum);

        if (sortedTables.length === 0) {
          toast({
            message: '업데이트할 테이블이 없습니다.',
            variant: 'error',
          });
          return;
        }

        if (sortedTables.length !== tableCount) {
          toast({
            message: '테이블 전체 수는 변경할 수 없습니다.',
            variant: 'error',
          });
          return;
        }

        setIsUploadingQr(true);
        const targets = sortedTables.map((table) => ({
          id: table.id,
          storeId: table.storeId,
          tableNum: table.tableNum,
        }));

        const { succeeded, failed } = await uploadQrImages(targets);
        const updateFailures = await updateQrImagesByTable(succeeded);
        const pendingRetries = [...failed, ...updateFailures];

        await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });
        onLayoutSaved?.({ columns: tableColumns, rows: tableRows });

        if (pendingRetries.length > 0) {
          const message = buildRetryMessage(failed.length, updateFailures.length);
          setRetryEntries(pendingRetries);
          setRetryMessage(message);
          toast({
            message,
            variant: 'error',
          });
        } else {
          setRetryEntries([]);
          setRetryMessage(null);
          toast({
            message: '테이블이 업데이트 되었습니다.',
            variant: 'info',
          });
          setOpen(false);
        }
        return;
      }

      setIsUploadingQr(true);
      const createdTables = await createAllTables({
        storeId,
        count: tableCount,
      });

      const targets = createdTables.map((table) => ({
        id: table.id,
        storeId: table.storeId,
        tableNum: table.tableNum,
      }));

      const { succeeded, failed } = await uploadQrImages(targets);
      const updateFailures = await updateQrImages(succeeded);
      const pendingRetries = [...failed, ...updateFailures];

      await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });
      onCreated?.(createdTables, { columns: tableColumns, rows: tableRows });
      onLayoutSaved?.({ columns: tableColumns, rows: tableRows });

      if (pendingRetries.length > 0) {
        const message = buildRetryMessage(failed.length, updateFailures.length);
        setRetryEntries(pendingRetries);
        setRetryMessage(message);
        toast({
          message,
          variant: 'error',
        });
      } else {
        setRetryEntries([]);
        setRetryMessage(null);
        toast({
          message: '테이블이 생성되었습니다.',
          variant: 'info',
        });
        setOpen(false);
      }
    } catch (error) {
      toast({
        message: resolveErrorMessage(error),
        variant: 'error',
      });
      console.error('Failed to create table', error);
    } finally {
      setIsUploadingQr(false);
    }
  };

  const handleRetry = async () => {
    if (retryEntries.length === 0 || !storeId) return;

    try {
      setIsUploadingQr(true);

      const alreadyUploaded = retryEntries.filter((entry) => entry.qrImageUrl) as QrUploadEntryWithImage[];
      const needsUpload = retryEntries.filter((entry) => !entry.qrImageUrl);
      const { succeeded, failed } =
        needsUpload.length > 0 ? await uploadQrImages(needsUpload) : { succeeded: [], failed: [] };

      const updateTargets = [...alreadyUploaded, ...succeeded];
      const updateFailures = await (mode === 'edit'
        ? updateQrImagesByTable(updateTargets)
        : updateQrImages(updateTargets));
      const pendingRetries = [...failed, ...updateFailures];

      if (updateTargets.length > 0) {
        await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });
      }

      if (pendingRetries.length > 0) {
        const message = buildRetryMessage(failed.length, updateFailures.length);
        setRetryEntries(pendingRetries);
        setRetryMessage(message);
        toast({
          message,
          variant: 'error',
        });
      } else {
        setRetryEntries([]);
        setRetryMessage(null);
        toast({
          message: 'QR 업로드가 완료되었습니다.',
          variant: 'info',
        });
        setOpen(false);
      }
    } catch (error) {
      toast({
        message: resolveErrorMessage(error),
        variant: 'error',
      });
      console.error('Failed to retry QR upload', error);
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
            {retryMessage ? (
              <div className={styles.retryNotice} role="status" aria-live="polite">
                <span className={styles.retryText}>{retryMessage}</span>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  className={styles.retryButton}
                  disabled={isUploadingQr}
                  onClick={handleRetry}
                >
                  재시도
                </Button>
              </div>
            ) : null}
          </ModalBody>
          <ModalFooter>
            <Button
              type="submit"
              size="md"
              fullWidth
              disabled={!isValid || isSubmitting || isUploadingQr || retryEntries.length > 0 || isLayoutUnchanged}
              isLoading={isPending || isUploadingQr || isUpdatingTableQrImage}
            >
              {name}
            </Button>
            <Button
              type="button"
              size="md"
              variant="danger"
              fullWidth
              disabled={isSubmitting || isPending || isUploadingQr || isUpdatingTableQrImage}
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
