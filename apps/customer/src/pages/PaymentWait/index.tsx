import {
  getCustomerOrdersByTableId,
  getPaymentTossDeeplink,
  postCreatedCustomerOrder,
} from '../../api/customer';
import type { CustomerOrderLookupResponse } from '../../api/customer/entity';
import CoinIcon from '../../assets/imgs/3d-coin-icon.png?url';
import BottomActionBar from '../../components/BottomActionBar';
import PageHeader from '../../components/PageHeader';
import { useToast } from '../../components/Toast/useToast';
import { useCart } from '../../stores/cart';
import {
  buildCartPath,
  buildOrderIssuePath,
  buildOrderPaymentAccountPath,
  buildOrderStatusPath,
  buildStoreHomePath,
  clearPendingOrderDraft,
  loadPendingOrderDraft,
  openTossWithStoreFallback,
  parsePositiveInt,
  savePendingOrderDraft,
  type PendingOrderDraft,
} from '../../utils/orderFlow';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './PaymentWait.module.scss';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

const hasSameMenus = (
  order: CustomerOrderLookupResponse,
  draft: PendingOrderDraft,
) => {
  const orderMenuQuantities = new Map<number, number>();
  const draftMenuQuantities = new Map<number, number>();

  order.menus
    .filter((menu) => !menu.isService)
    .forEach((menu) => {
      orderMenuQuantities.set(
        menu.menuId,
        (orderMenuQuantities.get(menu.menuId) ?? 0) + menu.quantity,
      );
    });

  draft.items.forEach((item) => {
    draftMenuQuantities.set(
      item.menuId,
      (draftMenuQuantities.get(item.menuId) ?? 0) + item.quantity,
    );
  });

  if (orderMenuQuantities.size !== draftMenuQuantities.size) {
    return false;
  }

  for (const [menuId, quantity] of draftMenuQuantities) {
    if (orderMenuQuantities.get(menuId) !== quantity) {
      return false;
    }
  }

  return true;
};

const isMatchingCreatedOrder = (
  order: CustomerOrderLookupResponse,
  draft: PendingOrderDraft,
) => {
  const draftCreatedAt = new Date(draft.createdAt).getTime();
  const orderCreatedAt = new Date(order.createdAt).getTime();

  if (
    Number.isFinite(draftCreatedAt) &&
    Number.isFinite(orderCreatedAt) &&
    orderCreatedAt < draftCreatedAt - 5_000
  ) {
    return false;
  }

  return (
    order.tableId === draft.tableId &&
    order.storeId === draft.storeId &&
    order.tableNum === draft.tableNum &&
    order.depositorName === draft.depositorName &&
    order.couponAmount === draft.couponAmount &&
    order.cashAmount === draft.paymentAmount &&
    hasSameMenus(order, draft)
  );
};

const findCreatedOrderFromDraft = async (draft: PendingOrderDraft) => {
  const orders = await getCustomerOrdersByTableId(draft.storeId, draft.tableNum);

  return [...orders]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
    .find((order) => isMatchingCreatedOrder(order, draft));
};

export default function PaymentWaitPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart, setActiveTable } = useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get('tableNum')),
    [searchParams],
  );
  const hasTableContext = storeId !== null && tableNum !== null;
  const draft = useMemo(() => loadPendingOrderDraft(), []);
  const hasRedirectedRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);
  const [isMovingNext, setIsMovingNext] = useState(false);

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  useEffect(() => {
    if (
      !hasTableContext ||
      !draft ||
      draft.storeId !== storeId ||
      draft.tableNum !== tableNum
    ) {
      if (hasRedirectedRef.current || !hasTableContext) return;
      hasRedirectedRef.current = true;
      toast({
        message: '결제 정보를 다시 준비해 주세요.',
        variant: 'warning',
        duration: 1500,
      });
      navigate(hasTableContext ? buildCartPath(storeId, tableNum) : '/cart', {
        replace: true,
      });
    }
  }, [draft, hasTableContext, navigate, storeId, tableNum, toast]);

  const ensureTossDeeplink = useCallback(async () => {
    if (!draft) {
      throw new Error('Missing draft');
    }

    if (draft.tossDeeplink) {
      return draft;
    }

    console.log('[DEEPLINK_REQUEST_AMOUNT]', {
      draftPaymentAmount: draft.paymentAmount,
      storeId: draft.storeId,
    });

    const paymentInfo = await getPaymentTossDeeplink({
      storeId: draft.storeId,
      amount: draft.paymentAmount,
    });

    console.log('[DEEPLINK_RESPONSE]', paymentInfo);

    const nextDraft = {
      ...draft,
      tossDeeplink: paymentInfo.tossDeeplink,
      account: paymentInfo.account,
    };

    savePendingOrderDraft(nextDraft);
    return nextDraft;
  }, [draft]);

  const openToss = useCallback(async () => {
    const latestDraft = await ensureTossDeeplink();

    await openTossWithStoreFallback(latestDraft.tossDeeplink, () => {
      toast({
        message: '모바일 기기에서 토스 앱으로 결제해 주세요.',
        variant: 'info',
        duration: 1500,
      });
    });
  }, [ensureTossDeeplink, toast]);

  useEffect(() => {
    if (!draft || hasAutoOpenedRef.current) return;

    hasAutoOpenedRef.current = true;
    openToss().catch((error) => {
      const status = (error as { status?: number } | null)?.status;
      toast({
        message:
          status === 404
            ? '입금 계좌 정보를 찾을 수 없어요. 다시 시도해 주세요.'
            : '토스 앱을 열지 못했어요. 다시 시도해 주세요.',
        variant: 'error',
        duration: 1500,
      });
    });
  }, [draft, openToss, toast]);

  const handleCompletePayment = async () => {
    if (!draft || isMovingNext) return;

    try {
      setIsMovingNext(true);
      if (draft.orderId !== null) {
        clearPendingOrderDraft();
        clearCart();
        navigate(
          buildOrderStatusPath(draft.storeId, draft.tableNum, draft.orderId),
          {
            replace: true,
          },
        );
        return;
      }

      const existingOrder = await findCreatedOrderFromDraft(draft).catch(
        () => null,
      );

      if (existingOrder) {
        clearPendingOrderDraft();
        clearCart();
        navigate(
          buildOrderStatusPath(
            existingOrder.storeId,
            existingOrder.tableNum,
            existingOrder.id,
          ),
          {
            replace: true,
          },
        );
        return;
      }

      const createdOrder = await postCreatedCustomerOrder({
        tableNum: draft.tableNum,
        storeId: draft.storeId,
        depositorName: draft.depositorName,
        couponAmount: draft.couponAmount,
        idempotencyKey: draft.idempotencyKey,
        menus: draft.items.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
      });

      clearPendingOrderDraft();
      clearCart();
      navigate(
        buildOrderStatusPath(
          createdOrder.storeId,
          createdOrder.tableNum,
          createdOrder.id,
        ),
        {
          replace: true,
        },
      );
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      if (status === 409) {
        navigate(buildOrderIssuePath(draft.storeId, draft.tableNum), {
          replace: true,
        });
        return;
      }

      const createdOrder = await findCreatedOrderFromDraft(draft).catch(
        () => null,
      );

      if (createdOrder) {
        clearPendingOrderDraft();
        clearCart();
        navigate(
          buildOrderStatusPath(
            createdOrder.storeId,
            createdOrder.tableNum,
            createdOrder.id,
          ),
          {
            replace: true,
          },
        );
        return;
      }

      toast({
        message: '주문 접수에 실패했어요. 다시 시도해 주세요.',
        variant: 'error',
        duration: 1500,
      });
      setIsMovingNext(false);
    }
  };

  if (
    !hasTableContext ||
    !draft ||
    draft.storeId !== storeId ||
    draft.tableNum !== tableNum
  ) {
    return <main className={styles.paymentWait} />;
  }

  return (
    <main className={styles.paymentWait}>
      <PageHeader
        title='결제 진행'
        onBack={() =>
          navigate(
            hasTableContext ? buildStoreHomePath(storeId, tableNum) : '/cart',
          )
        }
      />

      <section className={styles.paymentWait__content}>
        <img
          src={CoinIcon}
          alt='결제 대기 아이콘'
          className={styles.paymentWait__coinIcon}
        />
        <div className={styles.paymentWait__headline}>
          결제 완료 후
          <br />
          아래 결제 완료 버튼을 눌러주세요
        </div>
        <div className={styles.paymentWait__summary}>
          {formatPrice(draft.paymentAmount)}
        </div>
        <div className={styles.paymentWait__helper}>
          <button
            type='button'
            className={styles.paymentWait__linkButton}
            onClick={() =>
              navigate(buildOrderPaymentAccountPath(storeId, tableNum))
            }
          >
            토스앱이 열리지 않나요?
          </button>
        </div>
      </section>

      <BottomActionBar>
        <button
          type='button'
          className={styles.paymentWait__submitButton}
          disabled={isMovingNext}
          onClick={() => void handleCompletePayment()}
        >
          {isMovingNext ? '주문 접수 중...' : '결제 완료'}
        </button>
      </BottomActionBar>
    </main>
  );
}
