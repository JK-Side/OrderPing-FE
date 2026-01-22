import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import type { AllTableListResponse } from '@/api/table/entity';
import AddTableIcon from '@/assets/icons/add-table.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useCreateAllTable } from '@/pages/StoreStart/hooks/useCreateAllTable';
import { MESSAGES, REGEX } from '@/static/validation';
import styles from './TableCreateModal.module.scss';

interface TableCreateModalProps {
  storeId?: number;
  onCreated?: (tables: AllTableListResponse, layout: { columns: number; rows: number }) => void;
}

interface TableCreateForm {
  tableCount: string;
  tableColumns: string;
  tableRows: string;
}

export default function TableCreateModal({ storeId, onCreated }: TableCreateModalProps) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createAllTables, isPending } = useCreateAllTable();
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

      const response = await createAllTables({
        storeId,
        count: tableCount,
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
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button className={styles.triggerButton} size="md" disabled={!storeId}>
          <AddTableIcon className={styles.triggerIcon} aria-hidden="true" />
          테이블 추가
        </Button>
      </ModalTrigger>
      <ModalContent>
        <ModalHeader>
          <ModalTitle>테이블 추가</ModalTitle>
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
              size="lg"
              fullWidth
              disabled={!isValid || isSubmitting}
              isLoading={isPending}
            >
              테이블 생성
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
