import { useQueryClient } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { useState } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { useForm, useWatch, type SubmitHandler } from 'react-hook-form';
import type { TableResponse } from '@/api/table/entity';
import AddTableIcon from '@/assets/icons/add-table.svg?react';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
// import { useClearTable } from '@/pages/TableOperate/hooks/useClearTable';
import { useCreateAllTable } from '@/pages/TableOperate/hooks/useCreateAllTable';
import { useUpdateTableQrImage } from '@/pages/TableOperate/hooks/useUpdateTableQrImage';
import { useUpdateTableQrImages } from '@/pages/TableOperate/hooks/useUpdateTableQrImages';
import { MESSAGES, REGEX } from '@/static/validation';
import { usePresignedUploader } from '@/utils/hooks/usePresignedUploader';
import styles from './TableCreateModal.module.scss';

const QR_IMAGE_SIZE = 256;
const QR_S3_DIRECTORY = 'tables';
const CUSTOMER_PRODUCTION_URL = 'https://order-ping-customer.vercel.app';

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

type ProgressPhase = 'idle' | 'creating' | 'qrGenerating' | 'qrSaving' | 'finalizing';

const PROGRESS_PHASE_LABEL: Record<Exclude<ProgressPhase, 'idle'>, string> = {
  creating: '테이블 생성 중입니다.',
  qrGenerating: 'QR 코드 생성 중입니다.',
  qrSaving: 'QR 정보를 저장 중입니다.',
  finalizing: '거의 다 됐어요, 조금만 기다려 주세요!',
};

const createQrSvgMarkup = (value: string) => {
  const qrSvg = renderToStaticMarkup(<QRCodeSVG value={value} size={QR_IMAGE_SIZE} level="M" includeMargin />);
  const svgWithNamespace = qrSvg.includes('xmlns=')
    ? qrSvg
    : qrSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');

  return `<?xml version="1.0" encoding="UTF-8"?>\n${svgWithNamespace}`;
};

const resolveCustomerBaseUrl = () => {
  const configuredBaseUrl = import.meta.env.VITE_CUSTOMER_URL?.trim();
  if (configuredBaseUrl) return configuredBaseUrl;
  return CUSTOMER_PRODUCTION_URL;
};

const createQrValue = (storeId: number, tableNum: number) => {
  const url = new URL(`/stores/${storeId}`, resolveCustomerBaseUrl());
  url.searchParams.set('tableNum', String(tableNum));

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

// const resolveOrderStatuses = (rawStatus: TableResponse['orderStatus']) => {
//   if (!rawStatus) return [];
//   return Array.isArray(rawStatus) ? rawStatus : [rawStatus];
// };

// const hasIncompleteOrderOnTable = (table: TableResponse) => {
//   const statuses = resolveOrderStatuses(table.orderStatus);
//   if (statuses.length > 0) {
//     return statuses.some((status) => status !== 'COMPLETE');
//   }

//   return (
//     (table.orderMenus?.length ?? 0) > 0 || (table.serviceMenus?.length ?? 0) > 0 || (table.totalOrderAmount ?? 0) > 0
//   );
// };

interface TableCreateModalProps {
  storeId?: number;
  name: string;
  hasActiveOrders?: boolean;
  onReset?: () => void;
  mode?: 'create' | 'edit';
  tables?: TableResponse[];
  initialValues?: {
    tableCount: number;
  } | null;
}

interface TableCreateForm {
  tableCount: string;
}

export default function TableCreateModal({
  storeId,
  name,
  hasActiveOrders = false,
  onReset,
  mode = 'create',
  tables: existingTables = [],
  initialValues = null,
}: TableCreateModalProps) {
  const [open, setOpen] = useState(false);
  const [progressPhase, setProgressPhase] = useState<ProgressPhase>('idle');
  const [isUploadingQr, setIsUploadingQr] = useState(false);
  // const [isResettingTables, setIsResettingTables] = useState(false);
  const [retryEntries, setRetryEntries] = useState<QrUploadEntry[]>([]);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { mutateAsync: createAllTables, isPending } = useCreateAllTable();
  // const { mutateAsync: clearTable } = useClearTable();
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
    },
  });

  const getInitialFormValues = (): TableCreateForm => {
    if (!initialValues) {
      return {
        tableCount: '',
      };
    }

    return {
      tableCount: String(initialValues.tableCount),
    };
  };

  const watchedTableCount = useWatch({ control, name: 'tableCount' });
  const parsedTableCount = Number(watchedTableCount);
  const normalizedTableCount = Number.isFinite(parsedTableCount) && parsedTableCount > 0 ? parsedTableCount : 0;
  const isEditMode = mode === 'edit';
  const isProgressActive = progressPhase !== 'idle';
  const progressMessage = progressPhase === 'idle' ? '' : PROGRESS_PHASE_LABEL[progressPhase];
  const isLayoutUnchanged =
    isEditMode && !!initialValues && Number(watchedTableCount) === initialValues.tableCount;

  const closeModal = () => {
    setProgressPhase('idle');
    setOpen(false);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && isProgressActive) return;
    setOpen(nextOpen);
    if (nextOpen) {
      reset(getInitialFormValues());
      setRetryEntries([]);
      setRetryMessage(null);
      setIsUploadingQr(false);
      setProgressPhase('idle');
    }
  };

  const uploadQrImages = async (targets: QrUploadTarget[]) => {
    const results = await Promise.allSettled(
      targets.map(async (table) => {
        const qrValue = createQrValue(table.storeId, table.tableNum);
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

      if (!Number.isFinite(tableCount) || tableCount <= 0) {
        toast({
          message: '테이블 수를 다시 확인해 주세요.',
          variant: 'error',
        });
        return;
      }

      if (isEditMode) {
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
        setProgressPhase('qrGenerating');
        const targets = sortedTables.map((table) => ({
          id: table.id,
          storeId: table.storeId,
          tableNum: table.tableNum,
        }));

        const { succeeded, failed } = await uploadQrImages(targets);
        setProgressPhase('qrSaving');
        const updateFailures = await updateQrImagesByTable(succeeded);
        const pendingRetries = [...failed, ...updateFailures];

        setProgressPhase('finalizing');
        await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });

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
          closeModal();
        }
        return;
      }

      setIsUploadingQr(true);
      setProgressPhase('creating');
      const createdTables = await createAllTables({
        storeId,
        count: tableCount,
      });

      setProgressPhase('qrGenerating');
      const targets = createdTables.map((table) => ({
        id: table.id,
        storeId: table.storeId,
        tableNum: table.tableNum,
      }));

      const { succeeded, failed } = await uploadQrImages(targets);
      setProgressPhase('qrSaving');
      const updateFailures = await updateQrImages(succeeded);
      const pendingRetries = [...failed, ...updateFailures];

      setProgressPhase('finalizing');
      await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });

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
        closeModal();
      }
    } catch (error) {
      toast({
        message: resolveErrorMessage(error),
        variant: 'error',
      });
      console.error('Failed to create table', error);
    } finally {
      setIsUploadingQr(false);
      setProgressPhase('idle');
    }
  };

  const handleRetry = async () => {
    if (retryEntries.length === 0 || !storeId) return;

    try {
      setIsUploadingQr(true);

      const alreadyUploaded = retryEntries.filter((entry) => entry.qrImageUrl) as QrUploadEntryWithImage[];
      const needsUpload = retryEntries.filter((entry) => !entry.qrImageUrl);
      if (needsUpload.length > 0) {
        setProgressPhase('qrGenerating');
      }
      const { succeeded, failed } =
        needsUpload.length > 0 ? await uploadQrImages(needsUpload) : { succeeded: [], failed: [] };

      const updateTargets = [...alreadyUploaded, ...succeeded];
      setProgressPhase('qrSaving');
      const updateFailures = await (isEditMode ? updateQrImagesByTable(updateTargets) : updateQrImages(updateTargets));
      const pendingRetries = [...failed, ...updateFailures];

      if (updateTargets.length > 0) {
        setProgressPhase('finalizing');
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
        closeModal();
      }
    } catch (error) {
      toast({
        message: resolveErrorMessage(error),
        variant: 'error',
      });
      console.error('Failed to retry QR upload', error);
    } finally {
      setIsUploadingQr(false);
      setProgressPhase('idle');
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

  void handleResetTables;

  // const handleResetTablesSubmit = async () => {
  //   if (!storeId) return;
  //   if (hasActiveOrders) {
  //     toast({
  //       message: '모든 주문이 완료 상태가 아닙니다.',
  //       variant: 'error',
  //     });
  //     return;
  //   }
  //   if (!isEditMode) {
  //     toast({
  //       message: '기존 테이블이 있어야 전체 비우기를 진행할 수 있습니다.',
  //       variant: 'error',
  //     });
  //     return;
  //   }

  //   const resetTargets = existingTables.filter((table) => table.status !== 'CLOSED');
  //   if (resetTargets.length === 0) {
  //     toast({
  //       message: '비울 수 있는 테이블이 없습니다.',
  //       variant: 'error',
  //     });
  //     return;
  //   }

  //   const hasIncompleteOrderTables = resetTargets.some(hasIncompleteOrderOnTable);
  //   if (hasIncompleteOrderTables) {
  //     toast({
  //       message: 'Only tables with COMPLETE orders can be cleared.',
  //       variant: 'error',
  //     });
  //     return;
  //   }

  //   if (onReset) {
  //     await onReset();
  //     return;
  //   }

  //   try {
  //     setIsResettingTables(true);
  //     await Promise.all(resetTargets.map((table) => clearTable(table.id)));
  //     await queryClient.invalidateQueries({ queryKey: ['tables', storeId] });
  //     toast({
  //       message: '전체 테이블 비우기가 완료되었습니다.',
  //       variant: 'info',
  //     });
  //     setOpen(false);
  //   } catch (error) {
  //     toast({
  //       message: '전체 테이블 비우기에 실패했습니다.',
  //       description: error instanceof Error ? error.message : undefined,
  //       variant: 'error',
  //     });
  //   } finally {
  //     setIsResettingTables(false);
  //   }
  // };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button className={styles.triggerButton} size="md" disabled={!storeId}>
          <AddTableIcon className={styles.triggerIcon} aria-hidden="true" />
          {name}
        </Button>
      </ModalTrigger>
      <ModalContent
        onEscapeKeyDown={(event) => {
          if (isProgressActive) event.preventDefault();
        }}
        onInteractOutside={(event) => {
          if (isProgressActive) event.preventDefault();
        }}
      >
        <ModalHeader showClose={!isProgressActive}>
          <ModalTitle>{name}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <ModalBody>
            {isProgressActive ? (
              <div className={styles.progressPanel} role="status" aria-live="polite">
                <div className={styles.progressSpinner} aria-hidden="true" />
                <p className={styles.progressTitle}>{progressMessage}</p>
                <p className={styles.progressDescription}>작업 중에는 창을 닫지 말고 잠시 기다려 주세요.</p>
              </div>
            ) : (
              <>
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
              </>
            )}
          </ModalBody>
          <ModalFooter>
            {isProgressActive ? (
              <Button type="button" size="md" fullWidth disabled isLoading>
                {progressMessage}
              </Button>
            ) : (
              <Button
                type="submit"
                size="md"
                fullWidth
                disabled={
                  !isValid ||
                  isSubmitting ||
                  isUploadingQr ||
                  retryEntries.length > 0 ||
                  isLayoutUnchanged ||
                  normalizedTableCount <= 0
                }
                isLoading={isPending || isUploadingQr || isUpdatingTableQrImage}
              >
                {`테이블 ${normalizedTableCount}개 ${isEditMode ? '수정' : '생성'}`}
              </Button>
            )}
            {/* {!isEditMode ? (
            <Button
              type="button"
              size="md"
              variant="danger"
              fullWidth
              disabled={isSubmitting || isPending || isUploadingQr || isUpdatingTableQrImage || isResettingTables}
              isLoading={isResettingTables}
              onClick={handleResetTablesSubmit}
            >
              전체 테이블 비우기
            </Button>
            ) : null} */}
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
