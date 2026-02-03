import { useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import { Controller, useForm, type SubmitHandler } from 'react-hook-form';
import type { TableResponse } from '@/api/table/entity';
import Button from '@/components/Button';
import { Input } from '@/components/Input';
import { Modal, ModalBody, ModalContent, ModalFooter, ModalHeader, ModalTitle } from '@/components/Modal';
import { useToast } from '@/components/Toast/useToast';
import { useAvailableMenus } from '@/pages/TableOperate/hooks/useAvailableMenus';
import { useCreateOrder } from '@/pages/TableOperate/hooks/useCreateOrder';
import { REGEX } from '@/static/validation';
import styles from './TableServiceModal.module.scss';

interface TableServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: TableResponse | null;
}

interface ServiceAddForm {
  menuId: string;
  quantity: string;
}

const formatTableLabel = (tableNum: number) => `테이블 ${String(tableNum).padStart(2, '0')}`;

export default function TableServiceModal({ open, onOpenChange, table }: TableServiceModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: menus = [], isLoading } = useAvailableMenus(table?.storeId);
  const { mutateAsync: createOrder, isPending } = useCreateOrder();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isValid, isSubmitting },
  } = useForm<ServiceAddForm>({
    mode: 'onChange',
    defaultValues: {
      menuId: '',
      quantity: '',
    },
  });

  const menuOptions = useMemo(
    () =>
      menus.map((menu) => ({
        value: String(menu.id),
        label: menu.name,
        disabled: menu.isSoldOut,
      })),
    [menus],
  );

  const hasSelectableMenu = menuOptions.some((option) => !option.disabled);
  const selectPlaceholder = isLoading
    ? '메뉴를 불러오는 중입니다.'
    : hasSelectableMenu
      ? '메뉴를 선택해 주세요.'
      : '판매 가능한 메뉴가 없습니다.';

  const handleModalOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset({
        menuId: '',
        quantity: '',
      });
    }
  };

  const handleSubmitForm: SubmitHandler<ServiceAddForm> = async (data) => {
    if (!table) return;

    const menuId = Number(data.menuId);
    const quantity = Number(data.quantity);
    const selectedMenu = menus.find((menu) => menu.id === menuId);

    if (!Number.isFinite(menuId) || menuId <= 0) {
      toast({
        message: '메뉴를 선택해 주세요.',
        variant: 'error',
      });
      return;
    }

    if (!selectedMenu) {
      toast({
        message: '메뉴 정보를 찾을 수 없습니다.',
        variant: 'error',
      });
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      toast({
        message: '수량을 1 이상으로 입력해 주세요.',
        variant: 'error',
      });
      return;
    }

    try {
      await createOrder({
        storeId: table.storeId,
        tableId: table.id,
        tableNum: table.tableNum,
        sessionId: '1',
        depositorName: '서비스',
        couponAmount: 0,
        menus: [
          {
            menuId,
            quantity,
            price: selectedMenu.price,
            isService: true,
          },
        ],
      });

      await queryClient.invalidateQueries({ queryKey: ['tables', table.storeId] });
      await queryClient.invalidateQueries({ queryKey: ['orders', table.storeId] });

      toast({
        message: '서비스 메뉴가 추가되었습니다.',
        variant: 'info',
      });
      handleModalOpenChange(false);
    } catch (error) {
      toast({
        message: '서비스 추가에 실패했습니다.',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      console.error('Failed to create service order', error);
    }
  };

  if (!table) return null;

  return (
    <Modal open={open} onOpenChange={handleModalOpenChange}>
      <ModalContent className={styles.modalContent}>
        <ModalHeader>
          <ModalTitle className={styles.tableTitle}>[서비스 추가] {formatTableLabel(table.tableNum)}</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <ModalBody className={styles.body}>
            <div className={styles.form}>
              <Input
                label="메뉴"
                required
                message={errors.menuId?.message}
                messageState={errors.menuId ? 'error' : undefined}
              >
                <Controller
                  name="menuId"
                  control={control}
                  rules={{ required: '메뉴를 선택해 주세요.' }}
                  render={({ field }) => (
                    <Input.InputSelect
                      name={field.name}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      options={menuOptions}
                      placeholder={selectPlaceholder}
                      disabled={isLoading || !hasSelectableMenu}
                      required
                    />
                  )}
                />
              </Input>

              <Input
                label="수량"
                required
                message={errors.quantity?.message}
                messageState={errors.quantity ? 'error' : undefined}
              >
                <Input.Text
                  type="text"
                  inputMode="numeric"
                  placeholder="수량을 숫자로 입력해 주세요. ex) 1"
                  {...register('quantity', {
                    required: '수량을 입력해 주세요.',
                    pattern: {
                      value: REGEX.NUMBER_ONLY,
                      message: '숫자만 입력해 주세요.',
                    },
                  })}
                />
              </Input>
            </div>
          </ModalBody>
          <ModalFooter className={styles.footer}>
            <div className={styles.footerButtons}>
              <Button
                type="submit"
                className={styles.footerButton}
                disabled={!isValid || isSubmitting || isPending || !hasSelectableMenu}
                isLoading={isSubmitting || isPending}
              >
                서비스 추가
              </Button>
              <Button
                type="button"
                variant="danger"
                className={styles.footerButton}
                onClick={() => handleModalOpenChange(false)}
              >
                취소
              </Button>
            </div>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}
