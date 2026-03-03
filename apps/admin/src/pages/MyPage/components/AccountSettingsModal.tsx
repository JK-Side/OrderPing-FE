import { useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import type { MyPageStore } from '@/api/user/entity';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle, ModalTrigger } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useStoreAccounts } from '@/pages/MyPage/hooks/useStoreAccounts';
import { useUpdateStoreAccount } from '@/pages/MyPage/hooks/useUpdateStoreAccount';
import { useBanks } from '@/pages/StoreCreate/hooks/useBanks';
import styles from './InfoEditModal.module.scss';

interface AccountSettingsModalProps {
  store: MyPageStore;
  className?: string;
}

interface AccountSettingsForm {
  bankCode: string;
  accountHolder: string;
  accountNumber: string;
}

export default function AccountSettingsModal({ store, className }: AccountSettingsModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: banks, isLoading: isBanksLoading } = useBanks();
  const { mutateAsync: updateStoreAccount } = useUpdateStoreAccount();
  const [open, setOpen] = useState(false);
  const { data: storeAccounts = [], isPending: isStoreAccountsPending } = useStoreAccounts(store.storeId, open);
  const bankOptions = banks?.map((bank) => ({ value: bank.code, label: bank.name })) ?? [];
  const activeAccount = storeAccounts.find((account) => account.isActive) ?? storeAccounts[0];
  const accountId = activeAccount?.id;

  const {
    register,
    control,
    reset,
    handleSubmit,
    formState: { errors, isValid, isSubmitting },
  } = useForm<AccountSettingsForm>({
    mode: 'onChange',
    defaultValues: {
      bankCode: store.account?.bankCode ?? '',
      accountHolder: store.account?.accountHolder ?? '',
      accountNumber: store.account?.accountNumber ?? '',
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (nextOpen) {
      reset({
        bankCode: store.account?.bankCode ?? '',
        accountHolder: store.account?.accountHolder ?? '',
        accountNumber: store.account?.accountNumber ?? '',
      });
    }
  };

  const handleSubmitAccount: SubmitHandler<AccountSettingsForm> = async (data) => {
    if (!accountId) {
      const message = '계좌 id가 필요합니다.';
      toast({
        message,
        variant: 'error',
      });
      return;
    }

    try {
      await updateStoreAccount({
        accountId,
        body: {
          bankCode: data.bankCode,
          accountHolder: data.accountHolder.trim(),
          accountNumber: data.accountNumber.trim(),
        },
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['myPage'] }),
        queryClient.invalidateQueries({ queryKey: ['storeAccounts', store.storeId] }),
      ]);

      toast({
        message: '계좌 정보가 수정되었습니다.',
        variant: 'info',
      });
      setOpen(false);
    } catch (error) {
      const status = (error as { status?: number })?.status;

      if (status === 401) {
        toast({
          message: '로그인이 필요합니다',
          variant: 'error',
        });
      } else if (status === 403) {
        toast({
          message: '본인 계좌가 아닙니다.',
          variant: 'error',
        });
      } else if (status === 404) {
        toast({
          message: '계좌를 찾을 수 없습니다.',
          variant: 'error',
        });
      } else {
        toast({
          message: '계좌 정보 업데이트에 실패했습니다.',
          variant: 'error',
        });
      }
    }
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange}>
      <ModalTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          className={clsx(styles.triggerButton, className)}
          disabled={!store.account}
        >
          수정하기
        </Button>
      </ModalTrigger>

      <ModalContent className={styles.modalContent}>
        <ModalHeader>
          <ModalTitle>계좌 정보 수정</ModalTitle>
        </ModalHeader>

        <form onSubmit={handleSubmit(handleSubmitAccount)}>
          <ModalBody>
            <div className={styles.form}>
              <Input
                label="은행명"
                required
                message={errors.bankCode?.message}
                messageState={errors.bankCode ? 'error' : undefined}
              >
                <Controller
                  name="bankCode"
                  control={control}
                  rules={{ required: 'Select a bank.' }}
                  render={({ field }) => (
                    <Input.InputSelect
                      name={field.name}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      options={bankOptions}
                      placeholder="Select bank"
                      disabled={isBanksLoading || isSubmitting}
                      required
                    />
                  )}
                />
              </Input>

              <Input
                label="입금자명"
                required
                message={errors.accountHolder?.message}
                messageState={errors.accountHolder ? 'error' : undefined}
              >
                <Input.Text
                  placeholder="입금자명을 입력해 주세요."
                  {...register('accountHolder', {
                    required: '입금자명을 입력해 주세요.',
                  })}
                />
              </Input>

              <Input
                label="계좌번호"
                required
                message={errors.accountNumber?.message}
                messageState={errors.accountNumber ? 'error' : undefined}
              >
                <Input.Text
                  placeholder="계좌번호를 입력해 주세요."
                  inputMode="numeric"
                  {...register('accountNumber', {
                    required: '계좌번호를 입력해 주세요.',
                  })}
                />
              </Input>
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              type="submit"
              size="md"
              className={styles.footerButton}
              isLoading={isSubmitting}
              disabled={!isValid || isSubmitting || isStoreAccountsPending || !accountId}
              loadingText="수정 중..."
            >
              수정하기
            </Button>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
