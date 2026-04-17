import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Controller, useForm, useWatch, type SubmitHandler } from 'react-hook-form';
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
  depositorName: string;
  couponAmount: string;
}

type QuantityMap = Record<number, number>;

const isOrderableTable = (table: TableResponse) => table.status === 'OCCUPIED' || table.status === 'EMPTY';
const formatTableLabel = (tableNum: number) => `테이블 ${String(tableNum).padStart(2, '0')}`;
const formatCurrency = (value: number) => `${value.toLocaleString('ko-KR')}원`;

export default function TableDirectOrderModal({ open, onOpenChange, storeId, tables }: TableDirectOrderModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: menus = [], isLoading: isMenuLoading } = useAvailableMenus(storeId);
  const { mutateAsync: createOrder, isPending } = useCreateOrder();
  const [quantityMap, setQuantityMap] = useState<QuantityMap>({});

  const orderableTables = useMemo(() => tables.filter(isOrderableTable), [tables]);
  const tableOptions = useMemo(
    () =>
      orderableTables.map((table) => ({
        value: String(table.id),
        label: formatTableLabel(table.tableNum),
      })),
    [orderableTables],
  );
  const selectedMenus = useMemo(
    () =>
      menus.flatMap((menu) => {
        const quantity = quantityMap[menu.id] ?? 0;
        if (quantity <= 0) return [];
        return [
          {
            id: menu.id,
            quantity,
            price: menu.price,
          },
        ];
      }),
    [menus, quantityMap],
  );
  const selectedTotalCount = useMemo(
    () => selectedMenus.reduce((sum, menu) => sum + menu.quantity, 0),
    [selectedMenus],
  );
  const selectedSubtotal = useMemo(
    () => selectedMenus.reduce((sum, menu) => sum + menu.price * menu.quantity, 0),
    [selectedMenus],
  );

  const hasSelectableTable = tableOptions.length > 0;
  const tablePlaceholder = hasSelectableTable ? '테이블을 선택해 주세요.' : '주문 가능한 테이블이 없습니다.';

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
      depositorName: '관리자',
      couponAmount: '0',
    },
  });
  const couponAmountInput = useWatch({
    control,
    name: 'couponAmount',
  });
  const couponAmountValue = Number(couponAmountInput);
  const safeCouponAmount = Number.isFinite(couponAmountValue) && couponAmountValue >= 0 ? couponAmountValue : 0;
  const expectedCashAmount = Math.max(0, selectedSubtotal - safeCouponAmount);

  const handleModalOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      reset({
        tableId: '',
        depositorName: '관리자',
        couponAmount: '0',
      });
      setQuantityMap({});
    }
  };

  const handleIncreaseQuantity = (menuId: number) => {
    if (!storeId) return;
    setQuantityMap((prev) => ({
      ...prev,
      [menuId]: (prev[menuId] ?? 0) + 1,
    }));
  };

  const handleDecreaseQuantity = (menuId: number) => {
    if (!storeId) return;
    setQuantityMap((prev) => {
      const currentQuantity = prev[menuId] ?? 0;
      if (currentQuantity <= 0) return prev;

      const nextQuantity = currentQuantity - 1;
      if (nextQuantity <= 0) {
        const next = { ...prev };
        delete next[menuId];
        return next;
      }
      return {
        ...prev,
        [menuId]: nextQuantity,
      };
    });
  };

  const handleSubmitForm: SubmitHandler<DirectOrderForm> = async (data) => {
    if (!storeId) return;

    const selectedTableId = Number(data.tableId);
    const selectedTable = orderableTables.find((table) => table.id === selectedTableId);
    const couponAmount = Number(data.couponAmount);
    const depositorName = data.depositorName.trim();

    if (!selectedTable) {
      toast({
        message: '테이블을 선택해 주세요.',
        variant: 'error',
      });
      return;
    }

    if (selectedMenus.length === 0) {
      toast({
        message: '메뉴를 1개 이상 선택해 주세요.',
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
        menus: selectedMenus.map((menu) => ({
          menuId: menu.id,
          quantity: menu.quantity,
        })),
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
        <form className={styles.formRoot} onSubmit={handleSubmit(handleSubmitForm)}>
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
                    validate: (value) => Number(value) >= 0 || '쿠폰 금액은 0 이상으로 입력해 주세요.',
                  })}
                />
              </Input>
            </div>

            <section className={styles.menuSection}>
              <div className={styles.menuHeader}>
                <h3 className={styles.menuTitle}>메뉴 선택</h3>
                <p className={styles.menuDescription}>카드의 +/- 버튼으로 수량을 조절해 주세요.</p>
              </div>

              {isMenuLoading ? <p className={styles.menuState}>메뉴를 불러오는 중입니다.</p> : null}
              {!isMenuLoading && menus.length === 0 ? (
                <p className={styles.menuState}>등록된 메뉴가 없습니다.</p>
              ) : null}

              {!isMenuLoading && menus.length > 0 ? (
                <div className={styles.menuGridWrapper}>
                  <div className={styles.menuGrid}>
                    {menus.map((menu) => {
                      const quantity = quantityMap[menu.id] ?? 0;
                      const isMinusDisabled = quantity <= 0;
                      const isPlusDisabled = !storeId || menu.isSoldOut;

                      return (
                        <article key={menu.id} className={styles.menuCard}>
                          <div className={styles.menuCardHead}>
                            <h4 className={styles.menuName}>{menu.name}</h4>
                            {menu.isSoldOut ? <span className={styles.soldOutBadge}>품절</span> : null}
                          </div>
                          <div className={styles.quantityControl}>
                            <button
                              type='button'
                              className={styles.quantityButton}
                              onClick={() => handleDecreaseQuantity(menu.id)}
                              disabled={isMinusDisabled || !storeId}
                              aria-label={`${menu.name} 수량 감소`}
                            >
                              -
                            </button>
                            <span className={styles.quantityValue}>{quantity}</span>
                            <button
                              type='button'
                              className={styles.quantityButton}
                              onClick={() => handleIncreaseQuantity(menu.id)}
                              disabled={isPlusDisabled}
                              aria-label={`${menu.name} 수량 증가`}
                            >
                              +
                            </button>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                </div>
              ) : null}
            </section>

            <section className={styles.summarySection}>
              <div className={styles.summaryRow}>
                <span>총 선택 수량</span>
                <strong>{selectedTotalCount}개</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>주문 금액</span>
                <strong>{formatCurrency(selectedSubtotal)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>예상 결제 금액</span>
                <strong>{formatCurrency(expectedCashAmount)}</strong>
              </div>
            </section>
          </ModalBody>
          <ModalFooter className={styles.footer}>
            <div className={styles.footerButtons}>
              <Button
                type='submit'
                className={styles.footerButton}
                disabled={!storeId || !isValid || isSubmitting || isPending || !hasSelectableTable || selectedMenus.length === 0}
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
