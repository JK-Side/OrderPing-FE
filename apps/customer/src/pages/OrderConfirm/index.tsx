import { Input } from "@order-ping/shared/components/Input";
import {
  getPaymentTossDeeplink,
  postCreatedCustomerOrder,
} from "../../api/customer";
import BottomActionBar from "../../components/BottomActionBar";
import { useToast } from "../../components/Toast/useToast";
import { useCart } from "../../stores/cart";
import {
  buildCartPath,
  buildOrderPaymentWaitPath,
  parsePositiveInt,
  savePendingOrderDraft,
} from "../../utils/orderFlow";
import { useStoreOrder } from "../Home/hooks/useStoreOrder";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import styles from "./OrderConfirm.module.scss";
import PageHeader from "../../components/PageHeader";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export default function OrderConfirmPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { clearCart, setActiveTable, items, totalQuantity, totalPrice } =
    useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get("tableNum")),
    [searchParams],
  );
  const hasTableContext = storeId !== null && tableNum !== null;
  const { data, isLoading } = useStoreOrder(storeId, tableNum);
  const [depositorName, setDepositorName] = useState("");
  const [couponAmountInput, setCouponAmountInput] = useState("");
  const [isPreparingPayment, setIsPreparingPayment] = useState(false);
  const [isDepositorNameTouched, setIsDepositorNameTouched] = useState(false);

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  const couponAmount = useMemo(() => {
    const digits = couponAmountInput.replace(/[^0-9]/g, "");
    if (digits === "") return 0;

    const parsed = Number(digits);
    if (!Number.isFinite(parsed) || parsed < 0) return 0;
    return Math.min(parsed, totalPrice);
  }, [couponAmountInput, totalPrice]);

  const paymentAmount = Math.max(totalPrice - couponAmount, 0);
  const backToCartPath = hasTableContext
    ? buildCartPath(storeId, tableNum)
    : "/cart";
  const depositorNameError =
    isDepositorNameTouched && !depositorName.trim()
      ? "입금자명을 입력해 주세요."
      : undefined;

  const handleCouponAmountChange = (value: string) => {
    const digits = value.replace(/[^0-9]/g, "");
    setCouponAmountInput(digits);
  };

  const handleProceedPayment = async () => {
    if (items.length === 0 || isPreparingPayment) return;

    if (!hasTableContext || !data) {
      toast({
        message: "매장 정보를 불러오는 중이에요. 잠시 후 다시 시도해 주세요.",
        variant: "info",
        duration: 3000,
      });
      return;
    }

    if (!depositorName.trim()) {
      setIsDepositorNameTouched(true);
      return;
    }

    if (paymentAmount < 0) {
      toast({
        message: "최종 결제 금액은 0원보다 커야 해요.",
        variant: "warning",
        duration: 3000,
      });
      return;
    }

    try {
      setIsPreparingPayment(true);
      const normalizedCouponAmount =
        couponAmountInput.trim() === "" ? 0 : couponAmount;
      const normalizedPaymentAmount = Math.max(
        totalPrice - normalizedCouponAmount,
        0,
      );

      const createdOrder = await postCreatedCustomerOrder({
        tableId: data.tableId,
        tableNum: data.tableNum,
        storeId: data.storeId,
        depositorName: depositorName.trim(),
        couponAmount: normalizedCouponAmount,
        menus: items.map((item) => ({
          menuId: item.menuId,
          quantity: item.quantity,
        })),
      });

      const baseDraft = {
        orderId: createdOrder.id,
        storeId: data.storeId,
        tableId: data.tableId,
        tableNum: data.tableNum,
        depositorName: depositorName.trim(),
        couponAmount: normalizedCouponAmount,
        totalPrice,
        paymentAmount: normalizedPaymentAmount,
        tossDeeplink: "",
        account: {
          bankCode: "",
          bankName: "",
          accountHolder: "",
          accountNumber: "",
        },
        items,
        createdAt: new Date().toISOString(),
      };

      savePendingOrderDraft(baseDraft);
      clearCart();

      try {
        const paymentInfo = await getPaymentTossDeeplink({
          storeId: data.storeId,
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
              ? "입금 계좌 정보를 찾을 수 없어요. 다음 화면에서 다시 시도해 주세요."
              : "토스 결제 링크를 불러오지 못했어요. 다음 화면에서 다시 시도해 주세요.",
          variant: "error",
          duration: 3000,
        });
      }

      navigate(buildOrderPaymentWaitPath(storeId, tableNum));
    } catch (error) {
      const status = (error as { status?: number } | null)?.status;
      toast({
        message:
          status === 409
            ? "재고가 부족하여 주문할 수 없어요. 수량을 조절해 주세요."
            : "주문 생성에 실패했어요. 다시 시도해 주세요.",
        variant: "error",
        duration: 3000,
      });
    } finally {
      setIsPreparingPayment(false);
    }
  };

  return (
    <main className={styles.orderConfirm}>
      <PageHeader
        title="결제 전 확인"
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
                      className={styles["orderConfirm__itemQuantity--text"]}
                    >{`${item.quantity}개`}</div>
                  </div>
                </article>
              ))}
            </section>

            <section className={styles.orderConfirm__section}>
              <Input
                label="입금자명"
                required
                message={depositorNameError}
                messageState="error"
              >
                <Input.Text
                  id="depositorName"
                  placeholder="입금자명을 입력해 주세요."
                  value={depositorName}
                  maxLength={20}
                  onBlur={() => setIsDepositorNameTouched(true)}
                  onChange={(event) => setDepositorName(event.target.value)}
                />
              </Input>
            </section>

            <section className={styles.orderConfirm__section}>
              <Input label="쿠폰 적용">
                <Input.Text
                  id="couponAmount"
                  inputMode="numeric"
                  placeholder="쿠폰 금액을 입력해 주세요."
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
                <div>{formatPrice(couponAmount)}</div>
              </div>
              <div className={styles.orderConfirm__summaryFinal}>
                <span>최종 결제 금액</span>
                <div>{formatPrice(paymentAmount)}</div>
              </div>
            </section>
          </div>
        ) : null}
      </section>

      <BottomActionBar>
        <button
          type="button"
          className={styles.orderConfirm__submitButton}
          disabled={
            !hasTableContext || items.length === 0 || isPreparingPayment
          }
          onClick={handleProceedPayment}
        >
          <span className={styles.orderConfirm__submitCount}>
            {totalQuantity}
          </span>
          <span>
            {isPreparingPayment
              ? "주문 준비 중..."
              : `${formatPrice(paymentAmount)} 주문하기`}
          </span>
        </button>
      </BottomActionBar>
    </main>
  );
}
