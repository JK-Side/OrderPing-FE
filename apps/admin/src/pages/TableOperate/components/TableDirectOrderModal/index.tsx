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
import styles from './TableDirectOrderModal.module.scss';

interface TableDirectOrderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storeId?: number;
  tables: TableResponse[];
}

interface DirectOrderForm {
  tableId: string;
  menuId: string;
  quantity: string;
  depositorName: string;
  couponAmount: string;
}

const isOrderableTable = (table: TableResponse) => table.status === 'OCCUPIED' || table.status === 'EMPTY';
const formatTableLabel = (tableNum: number) => `테이블 ${String(tableNum).padStart(2, '0')}`;

export default function TableDirectOrderModal({ open, onOpenChange, storeId, tables }: TableDirectOrderModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: menus = [], isLoading: isMenuLoading } = useAvailableMenus(storeId);
  const { mutateAsync: createOrder, isPending } = useCreateOrder();

  const orderableTables = useMemo(() => tables.filter(isOrderableTable), [tables]);
  const tableOptions = useMemo(
    () =>
      orderableTables.map((table) => ({
        value: String(table.id),
        label: formatTableLabel(table.tableNum),
      })),
    [orderableTables],
  );
  const menuOptions = useMemo(
    () =>
      menus.map((menu) => ({
        value: String(menu.id),
        label: menu.name,
        disabled: menu.isSoldOut,
      })),
    [menus],
  );

  const hasSelectableTable = tableOptions.length > 0;
  const hasSelectableMenu = menuOptions.some((option) => !option.disabled);
  const tablePlaceholder = hasSelectableTable ? '테이블을 선택해 주세요.' : '주문 가능한 테이블이 없습니다.';
  const menuPlaceholder = isMenuLoading
    ? '메뉴를 불러오는 중입니다.'
    : hasSelectableMenu
      ? '메뉴를 선택해 주세요.'
      : '판매 가능한 메뉴가 없습니다.';

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<DirectOrderForm>({
    mode: 'onChange',
    defaultValues: {
      tableId: '',
      menuId: '',
      quantity: '1',
      depositorName: '관리자',
      couponAmount: '0',
    },
  });

  const handleModalOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset({
        tableId: '',
        menuId: '',
        quantity: '1',
        depositorName: '관리자',
        couponAmount: '0',
      });
    }
  };

  const handleSubmitForm: SubmitHandler<DirectOrderForm> = async (data) => {
    if (!storeId) return;

    const selectedTableId = Number(data.tableId);
    const selectedTable = orderableTables.find((table) => table.id === selectedTableId);
    const menuId = Number(data.menuId);
    const quantity = Number(data.quantity);
    const couponAmount = Number(data.couponAmount);
    const depositorName = data.depositorName.trim();

    if (!selectedTable) {
      toast({
        message: '테이블을 선택해 주세요.',
        variant: 'error',
      });
      return;
    }

    if (!Number.isFinite(menuId) || menuId <= 0) {
      toast({
        message: '메뉴를 선택해 주세요.',
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

    if (!depositorName) {
      toast({
        message: '입금자명을 입력해 주세요.',
        variant: 'error',
      });
      return;
    }

    if (!Number.isFinite(couponAmount) || couponAmount < 0) {
      toast({
        message: '쿠폰 금액은 0 이상의 숫자로 입력해 주세요.',
        variant: 'error',
      });
      return;
    }

    try {
      await createOrder({
        storeId,
        tableNum: selectedTable.tableNum,
        depositorName,
        couponAmount,
        menus: [
          {
            menuId,
            quantity,
          },
        ],
      });

      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['tables', storeId] }),
        queryClient.invalidateQueries({ queryKey: ['orders', storeId] }),
      ]);

      toast({
        message: '주문이 추가되었습니다.',
        variant: 'info',
      });

      handleModalOpenChange(false);
    } catch (error) {
      const status = (error as { status?: number })?.status;
      const message =
        status === 400
          ? '입력값이 올바르지 않습니다.'
          : status === 401
            ? '로그인이 필요한 기능입니다.'
            : status === 403
              ? '본인 매장의 테이블만 주문을 추가할 수 있습니다.'
              : status === 404
                ? '테이블 또는 메뉴를 찾을 수 없습니다.'
                : '주문 추가에 실패했습니다.';

      toast({
        message,
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
    }
  };

  return (
    <Modal open={open} onOpenChange={handleModalOpenChange}>
      <ModalContent className={styles.modalContent}>
        <ModalHeader>
          <ModalTitle className={styles.title}>주문 직접 추가</ModalTitle>
        </ModalHeader>
        <form onSubmit={handleSubmit(handleSubmitForm)}>
          <ModalBody className={styles.body}>
            <div className={styles.form}>
              <Input
                label='테이블'
                required
                message={errors.tableId?.message}
                messageState={errors.tableId ? 'error' : undefined}
              >
                <Controller
                  name='tableId'
                  control={control}
                  rules={{ required: '테이블을 선택해 주세요.' }}
                  render={({ field }) => (
                    <Input.InputSelect
                      name={field.name}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      options={tableOptions}
                      placeholder={tablePlaceholder}
                      disabled={!hasSelectableTable || !storeId}
                      required
                    />
                  )}
                />
              </Input>

              <Input
                label='메뉴'
                required
                message={errors.menuId?.message}
                messageState={errors.menuId ? 'error' : undefined}
              >
                <Controller
                  name='menuId'
                  control={control}
                  rules={{ required: '메뉴를 선택해 주세요.' }}
                  render={({ field }) => (
                    <Input.InputSelect
                      name={field.name}
                      value={field.value ?? ''}
                      onValueChange={field.onChange}
                      options={menuOptions}
                      placeholder={menuPlaceholder}
                      disabled={isMenuLoading || !hasSelectableMenu || !storeId}
                      required
                    />
                  )}
                />
              </Input>

              <Input
                label='수량'
                required
                message={errors.quantity?.message}
                messageState={errors.quantity ? 'error' : undefined}
              >
                <Input.Text
                  type='text'
                  inputMode='numeric'
                  placeholder='수량을 숫자로 입력해 주세요. ex) 1'
                  disabled={!storeId}
                  {...register('quantity', {
                    required: '수량을 입력해 주세요.',
                    pattern: {
                      value: REGEX.NUMBER_ONLY,
                      message: '숫자만 입력해 주세요.',
                    },
                    validate: (value) => Number(value) > 0 || '수량을 1 이상 입력해 주세요.',
                  })}
                />
              </Input>

              <Input
                label='입금자명'
                required
                message={errors.depositorName?.message}
                messageState={errors.depositorName ? 'error' : undefined}
              >
                <Input.Text
                  type='text'
                  placeholder='입금자명을 입력해 주세요.'
                  disabled={!storeId}
                  {...register('depositorName', {
                    required: '입금자명을 입력해 주세요.',
                    validate: (value) => value.trim().length > 0 || '입금자명을 입력해 주세요.',
                  })}
                />
              </Input>

              <Input
                label='쿠폰 금액'
                required
                message={errors.couponAmount?.message}
                messageState={errors.couponAmount ? 'error' : undefined}
              >
                <Input.Text
                  type='text'
                  inputMode='numeric'
                  placeholder='쿠폰 금액을 숫자로 입력해 주세요. ex) 0'
                  disabled={!storeId}
                  {...register('couponAmount', {
                    required: '쿠폰 금액을 입력해 주세요.',
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
                type='submit'
                className={styles.footerButton}
                disabled={
                  !storeId || !isValid || isSubmitting || isPending || !hasSelectableTable || !hasSelectableMenu
                }
                isLoading={isSubmitting || isPending}
              >
                주문 추가
              </Button>
              <Button
                type='button'
                variant='danger'
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
