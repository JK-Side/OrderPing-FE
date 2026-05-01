import { Input } from '@order-ping/shared/components/Input';
import { getPaymentTossDeeplink } from '../../api/customer';
import BottomActionBar from '../../components/BottomActionBar';
import { useToast } from '../../components/Toast/useToast';
import { useCart } from '../../stores/cart';
import {
  buildCartPath,
  buildOrderPaymentWaitPath,
  createOrderIdempotencyKey,
  parsePositiveInt,
  savePendingOrderDraft,
} from '../../utils/orderFlow';
import { useStoreOrder } from '../Home/hooks/useStoreOrder';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './OrderConfirm.module.scss';
import PageHeader from '../../components/PageHeader';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

export default function OrderConfirmPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { setActiveTable, items, totalQuantity, totalPrice } = useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get('tableNum')),
    [searchParams],
  );
  const hasTableContext = storeId !== null && tableNum !== null;
  const { data, isLoading, refetch } = useStoreOrder(storeId, tableNum);
  const [depositorName, setDepositorName] = useState('');
  const [couponAmountInput, setCouponAmountInput] = useState('');
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [isDepositorNameTouched, setIsDepositorNameTouched] = useState(false);

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  const couponAmount = useMemo(() => {
    const digits = couponAmountInput.replace(/[^0-9]/g, '');
    if (digits === '') return 0;

    const parsed = Number(digits);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return parsed;
  }, [couponAmountInput]);

  const isCouponAmountExceeded = couponAmount > totalPrice;
  const couponAmountError = isCouponAmountExceeded
    ? '주문 금액을 초과하는 쿠폰은 사용할 수 없어요.'
    : undefined;
  const appliedCouponAmount = isCouponAmountExceeded ? 0 : couponAmount;

  const paymentAmount = Math.max(totalPrice - appliedCouponAmount, 0);
  const isDepositorNameInvalid = !depositorName.trim();
  const backToCartPath = hasTableContext
    ? buildCartPath(storeId, tableNum)
    : '/cart';
  const depositorNameError =
    isDepositorNameTouched && isDepositorNameInvalid
      ? '입금자명을 입력해 주세요.'
      : undefined;

  const handleCouponAmountChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, '');
    setCouponAmountInput(digits);
  };

  const handleProceedPayment = async () => {
    if (items.length === 0 || isPreparingPayment) return;

    if (!hasTableContext || !data) {
      toast({
        message: '매장 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.',
        variant: 'info',
        duration: 1500,
      });
      return;
    }

    if (isDepositorNameInvalid) {
      setIsDepositorNameTouched(true);
      return;
    }

    if (isCouponAmountExceeded) {
      return;
    }

    if (paymentAmount < 0) {
      toast({
        message: '최종 결제 금액은 0원보다 커야 해요.',
        variant: 'warning',
        duration: 1500,
      });
      return;
    }

    try {
      setIsPreparingPayment(true);
      const { data: latestData } = await refetch();
      const latestOrderData = latestData ?? data;

      if (!latestOrderData) {
        toast({
          message: '주문 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.',
          variant: 'info',
          duration: 1500,
        });
        return;
      }

      const latestMenuById = new Map(
        latestOrderData.categories.flatMap((category) =>
          category.menus.map((menu) => [menu.id, menu] as const),
        ),
      );
      const normalizedItems = [];

      for (const item of items) {
        const latestMenu = latestMenuById.get(item.menuId);

        if (
          !latestMenu ||
          latestMenu.isSoldOut ||
          latestMenu.stock < item.quantity
        ) {
          toast({
            message: '재고가 부족하여 주문할 수 없어요. 수량을 조절해 주세요.',
            variant: 'warning',
            duration: 1500,
          });
          return;
        }

        normalizedItems.push({
          menuId: item.menuId,
          name: item.name,
          price: item.price,
          imageUrl: item.imageUrl,
          quantity: item.quantity,
        });
      }

      const normalizedTotalPrice = normalizedItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0,
      );
      const normalizedCouponAmount =
        couponAmountInput.trim() === '' ? 0 : appliedCouponAmount;

      if (normalizedCouponAmount > normalizedTotalPrice) {
        toast({
          message: '주문 금액을 초과하는 쿠폰은 사용할 수 없어요.',
          variant: 'warning',
          duration: 1500,
        });
        return;
      }

      const normalizedPaymentAmount = Math.max(
        normalizedTotalPrice - normalizedCouponAmount,
        0,
      );

      const baseDraft = {
        orderId: null,
        storeId: latestOrderData.storeId,
        tableId: latestOrderData.tableId,
        tableNum: latestOrderData.tableNum,
        idempotencyKey: createOrderIdempotencyKey(),
        depositorName: depositorName.trim(),
        couponAmount: normalizedCouponAmount,
        totalPrice: normalizedTotalPrice,
        paymentAmount: normalizedPaymentAmount,
        tossDeeplink: '',
        account: {
          bankCode: '',
          bankName: '',
          accountHolder: '',
          accountNumber: '',
        },
        items: normalizedItems,
        createdAt: new Date().toISOString(),
      };

      savePendingOrderDraft(baseDraft);

      try {
        const paymentInfo = await getPaymentTossDeeplink({
          storeId: latestOrderData.storeId,
          amount: normalizedPaymentAmount,
        });

        savePendingOrderDraft({
          ...baseDraft,
          tossDeeplink: paymentInfo.tossDeeplink,
          account: paymentInfo.account,
        });
      } catch (error) {
        const status = (error as { status?: number } | null)?.status;
        toast({
          message:
            status === 404
              ? '입금 계좌 정보를 찾을 수 없어요. 다음 화면에서 다시 시도해 주세요.'
              : '토스 결제 링크를 불러오지 못했어요. 다음 화면에서 다시 시도해 주세요.',
          variant: 'error',
          duration: 1500,
        });
      }

      navigate(buildOrderPaymentWaitPath(storeId, tableNum));
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      toast({
        message:
          status === 404
            ? '입금 계좌 정보를 찾을 수 없어요. 다시 시도해 주세요.'
            : '결제 준비에 실패했어요. 다시 시도해 주세요.',
        variant: 'error',
        duration: 1500,
      });
    } finally {
      setIsPreparingPayment(false);
    }
  };

  return (
    <main className={styles.orderConfirm}>
      <PageHeader
        title='결제 전 확인'
        onBack={() => navigate(backToCartPath)}
      />

      <section className={styles.orderConfirm__content}>
        {!hasTableContext ? (
          <div className={styles.orderConfirm__status}>
            테이블 정보를 확인할 수 없어요.
          </div>
        ) : null}
        {hasTableContext && isLoading ? (
          <div className={styles.orderConfirm__status}>
            주문 정보를 불러오는 중...
          </div>
        ) : null}

        {hasTableContext && !isLoading && items.length === 0 ? (
          <div className={styles.orderConfirm__status}>
            장바구니가 비어 있어요.
          </div>
        ) : null}

        {hasTableContext && !isLoading && items.length > 0 ? (
          <div className={styles.orderConfirm__sections}>
            <section className={styles.orderConfirm__section}>
              {items.map((item) => (
                <article
                  key={item.menuId}
                  className={styles.orderConfirm__item}
                >
                  <div className={styles.orderConfirm__itemName}>
                    {item.name}
                  </div>

                  <div className={styles.orderConfirm__itemPrice}>
                    {formatPrice(item.price)}
                  </div>
                  <div className={styles.orderConfirm__itemQuantity}>
                    <div
                      className={styles['orderConfirm__itemQuantity--text']}
                    >{`${item.quantity}개`}</div>
                  </div>
                </article>
              ))}
            </section>

            <section className={styles.orderConfirm__section}>
              <Input
                label='입금자명'
                required
                message={depositorNameError}
                messageState='error'
              >
                <Input.Text
                  id='depositorName'
                  placeholder='입금자명을 입력해 주세요.'
                  value={depositorName}
                  maxLength={20}
                  onBlur={() => setIsDepositorNameTouched(true)}
                  onChange={(event) => setDepositorName(event.target.value)}
                />
              </Input>
            </section>

            <section className={styles.orderConfirm__section}>
              <Input
                label='쿠폰 적용'
                message={couponAmountError}
                messageState='error'
              >
                <Input.Text
                  id='couponAmount'
                  inputMode='numeric'
                  placeholder='쿠폰 금액을 입력해 주세요.'
                  value={couponAmountInput}
                  onChange={(event) =>
                    handleCouponAmountChange(event.target.value)
                  }
                />
              </Input>
            </section>

            <section className={styles.orderConfirm__summary}>
              <div className={styles.orderConfirm__summaryRow}>
                <span>메뉴 합계</span>
                <div>{formatPrice(totalPrice)}</div>
              </div>
              <div className={styles.orderConfirm__summaryRow}>
                <span>쿠폰 사용</span>
                <div>{formatPrice(appliedCouponAmount)}</div>
              </div>
              <div className={styles.orderConfirm__summaryFinal}>
                <span>최종 결제 금액</span>
                <div>{formatPrice(paymentAmount)}</div>
              </div>

              {/* <div className={styles.orderConfirm__info}>
                최초 주문 시에는 테이블비가 포함되어 있을 수도 있어요.
              </div> */}
            </section>
          </div>
        ) : null}
      </section>

      <BottomActionBar>
        <button
          type='button'
          className={styles.orderConfirm__submitButton}
          disabled={
            !hasTableContext ||
            items.length === 0 ||
            isPreparingPayment ||
            isDepositorNameInvalid ||
            isCouponAmountExceeded
          }
          onClick={handleProceedPayment}
        >
          <span className={styles.orderConfirm__submitCount}>
            {totalQuantity}
          </span>
          <span>
            {isPreparingPayment
              ? '주문 준비 중...'
              : `${formatPrice(paymentAmount)} 주문하기`}
          </span>
        </button>
      </BottomActionBar>
    </main>
  );
}
