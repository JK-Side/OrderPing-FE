import { postCreatedCustomerOrder } from "../../api/customer";
import { useToast } from "../../components/Toast/useToast";
import { useCart } from "../../stores/cart";
import {
  buildCartPath,
  buildOrderIssuePath,
  buildOrderStatusPath,
  clearPendingOrderDraft,
  loadPendingOrderDraft,
  openTossWithStoreFallback,
  parsePositiveInt,
} from "../../utils/orderFlow";
import CoinIcon from "../../assets/3d-coin-icon.jpg?url";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import styles from "./PaymentWait.module.scss";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function PaymentWaitPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart, setActiveTable } = useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get("tableNum")),
    [searchParams],
  );
  const hasTableContext = storeId !== null && tableNum !== null;
  const draft = useMemo(() => loadPendingOrderDraft(), []);
  const hasRedirectedRef = useRef(false);
  const hasAutoOpenedRef = useRef(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);

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
        message: "결제 정보를 다시 준비해 주세요.",
        variant: "warning",
        duration: 3000,
      });
      navigate(hasTableContext ? buildCartPath(storeId, tableNum) : "/cart", {
        replace: true,
      });
    }
  }, [draft, hasTableContext, navigate, storeId, tableNum, toast]);

  const openToss = async () => {
    if (!draft) return;

    await openTossWithStoreFallback(draft.tossDeeplink, () => {
      toast({
        message: "모바일 기기에서 토스 앱으로 결제해 주세요.",
        variant: "info",
        duration: 3000,
      });
    });
  };

  useEffect(() => {
    if (!draft || hasAutoOpenedRef.current) return;

    hasAutoOpenedRef.current = true;
    openToss().catch(() => {
      toast({
        message: "토스 앱을 열지 못했어요. 다시 시도해 주세요.",
        variant: "error",
        duration: 3000,
      });
    });
  }, [draft, toast]);

  const handleCompletePayment = async () => {
    if (!draft || isSubmittingOrder) return;

    try {
      setIsSubmittingOrder(true);

      const createdOrder = await postCreatedCustomerOrder({
        tableId: draft.tableId,
        tableNum: draft.tableNum,
        storeId: draft.storeId,
        depositorName: draft.depositorName,
        couponAmount: draft.couponAmount,
        menus: draft.items.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
      });

      clearCart();
      clearPendingOrderDraft();
      navigate(
        buildOrderStatusPath(draft.storeId, draft.tableNum, createdOrder.id),
        {
          replace: true,
        },
      );
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;

      if (status === 409 && draft) {
        clearCart();
        navigate(buildOrderIssuePath(draft.storeId, draft.tableNum), {
          replace: true,
        });
        return;
      }

      clearPendingOrderDraft();
      toast({
        message:
          status === 400
            ? "주문 정보를 다시 확인해 주세요."
            : "주문 생성에 실패했어요. 장바구니로 돌아갈게요.",
        variant: "error",
        duration: 3000,
      });
      navigate(hasTableContext ? buildCartPath(storeId, tableNum) : "/cart", {
        replace: true,
      });
    } finally {
      setIsSubmittingOrder(false);
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
      <section className={styles.paymentWait__content}>
        <img
          src={CoinIcon}
          alt="결제 대기 아이콘"
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
            type="button"
            className={styles.paymentWait__linkButton}
            onClick={() => void openToss()}
          >
            토스앱이 열리지 않나요?
          </button>
        </div>
      </section>

      <footer className={styles.paymentWait__bottom}>
        <button
          type="button"
          className={styles.paymentWait__submitButton}
          disabled={isSubmittingOrder}
          onClick={handleCompletePayment}
        >
          {isSubmittingOrder ? "주문 접수 중..." : "결제 완료"}
        </button>
      </footer>
    </main>
  );
}
