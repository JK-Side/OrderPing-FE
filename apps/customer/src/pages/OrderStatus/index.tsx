import { getCustomerOrdersByTableId } from "../../api/customer";
import type { CustomerOrderLookupResponse } from "../../api/customer/entity";
import BottomActionBar from "../../components/BottomActionBar";
import PageHeader from "../../components/PageHeader";
import { useCart } from "../../stores/cart";
import {
  buildOrderHistoryPath,
  buildStoreHomePath,
  parsePositiveInt,
} from "../../utils/orderFlow";
import {
  ORDER_STATUS_STEPS,
  getOrderStatusMeta,
} from "../../utils/orderStatus";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import styles from "./OrderStatus.module.scss";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

const formatOrderTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
};

const getPaidAmount = (order: CustomerOrderLookupResponse) =>
  order.cashAmount > 0 ? order.cashAmount : order.totalPrice;

const getOrderMenuCount = (order: CustomerOrderLookupResponse) =>
  order.menus.reduce((sum, menu) => sum + menu.quantity, 0);

export default function OrderStatusPage() {
  const navigate = useNavigate();
  const { setActiveTable } = useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(
    () => parsePositiveInt(searchParams.get("tableNum")),
    [searchParams],
  );
  const orderId = useMemo(
    () => parsePositiveInt(searchParams.get("orderId")),
    [searchParams],
  );
  const hasTableContext = storeId !== null && tableNum !== null;

  const { data, isLoading, error } = useQuery({
    queryKey: ["customer", "orders", storeId, tableNum],
    queryFn: () =>
      getCustomerOrdersByTableId(storeId as number, tableNum as number),
    enabled: hasTableContext && orderId !== null,
    refetchInterval: (query) => {
      if (!orderId) return false;

      const orders = query.state.data as
        | CustomerOrderLookupResponse[]
        | undefined;
      const targetOrder = orders?.find((order) => order.id === orderId);
      if (targetOrder?.orderStatus === "COMPLETE") return false;

      return 5000;
    },
  });

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  const orders = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  );

  const currentOrder = useMemo(
    () =>
      orderId ? (orders.find((order) => order.id === orderId) ?? null) : null,
    [orderId, orders],
  );

  const hasNotFoundError =
    (error as { status?: number } | null)?.status === 404;
  const currentStatus = currentOrder?.orderStatus ?? "PENDING";
  const currentStatusMeta = getOrderStatusMeta(currentStatus);
  const title = currentOrder ? currentStatusMeta.label : "주문 상태";
  const titleDescription = currentOrder ? currentStatusMeta.description : "";
  const progressToneClassName = {
    red: styles["orderStatus__progress--red"],
    green: styles["orderStatus__progress--green"],
    blue: styles["orderStatus__progress--blue"],
  }[currentStatusMeta.tone];

  return (
    <main className={styles.orderStatus}>
      <PageHeader
        title="주문 완료"
        onBack={() =>
          navigate(
            hasTableContext ? buildStoreHomePath(storeId, tableNum) : "/",
          )
        }
      />

      <section className={styles.orderStatus__content}>
        <header className={styles.orderStatus__hero}>
          <h1 className={styles.orderStatus__title}>{title}</h1>
          {titleDescription ? (
            <div className={styles.orderStatus__description}>
              {titleDescription}
            </div>
          ) : null}
          {currentOrder ? (
            <div className={styles.orderStatus__summary}>
              {`총 ${getOrderMenuCount(currentOrder)}개 | ${formatPrice(getPaidAmount(currentOrder))}`}
            </div>
          ) : null}
        </header>

        {!hasTableContext ? (
          <div className={styles.orderStatus__status}>
            테이블 정보를 확인할 수 없어요.
          </div>
        ) : null}

        {hasTableContext && orderId === null ? (
          <div className={styles.orderStatus__status}>
            주문 정보를 확인할 수 없어요.
          </div>
        ) : null}

        {hasTableContext && orderId !== null && isLoading ? (
          <div className={styles.orderStatus__status}>
            주문 상태를 불러오는 중...
          </div>
        ) : null}

        {hasTableContext &&
        orderId !== null &&
        !isLoading &&
        hasNotFoundError ? (
          <div className={styles.orderStatus__status}>
            주문을 찾을 수 없어요.
          </div>
        ) : null}

        {hasTableContext &&
        orderId !== null &&
        !isLoading &&
        !hasNotFoundError &&
        error ? (
          <div className={styles.orderStatus__status}>
            주문 상태를 불러오지 못했어요.
          </div>
        ) : null}

        {hasTableContext &&
        orderId !== null &&
        !isLoading &&
        !error &&
        currentOrder ? (
          <section className={styles.orderStatus__list}>
            <ol
              className={[styles.orderStatus__progress, progressToneClassName]
                .filter(Boolean)
                .join(" ")}
            >
              {ORDER_STATUS_STEPS.map((status) => {
                const stepMeta = getOrderStatusMeta(status);
                const isDone = stepMeta.stepIndex < currentStatusMeta.stepIndex;
                const isActive =
                  stepMeta.stepIndex === currentStatusMeta.stepIndex;

                return (
                  <li
                    key={status}
                    className={[
                      styles.orderStatus__progressStep,
                      isDone ? styles["orderStatus__progressStep--done"] : "",
                      isActive
                        ? styles["orderStatus__progressStep--active"]
                        : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                  >
                    <span className={styles.orderStatus__stepDot} />
                    <span className={styles.orderStatus__stepLabel}>
                      {stepMeta.label}
                    </span>
                  </li>
                );
              })}
            </ol>

            <article className={styles.orderStatus__orderCard}>
              <div className={styles.orderStatus__orderHeader}>
                <span className={styles.orderStatus__orderNumber}>
                  {`주문 번호 ${String(currentOrder.id).padStart(2, "0")}`}
                </span>
                <span className={styles.orderStatus__orderTime}>
                  {formatOrderTime(currentOrder.createdAt)}
                </span>
              </div>

              <div className={styles.orderStatus__menuList}>
                {currentOrder.menus.map((menu) => (
                  <div
                    key={`${currentOrder.id}-${menu.menuId}`}
                    className={styles.orderStatus__menuLine}
                  >
                    <span className={styles.orderStatus__menuName}>
                      {menu.menuName}
                    </span>
                    <span
                      className={styles.orderStatus__menuQuantity}
                    >{`${menu.quantity}개`}</span>
                    {/* {`${menu.menuName} x ${menu.quantity}`} */}
                  </div>
                ))}
              </div>

              <div className={styles.orderStatus__orderPrice}>
                {formatPrice(getPaidAmount(currentOrder))}
              </div>
            </article>
          </section>
        ) : null}
      </section>

      <BottomActionBar>
        <div className={styles.orderStatus__buttonGroup}>
          <button
            type="button"
            className={styles.orderStatus__secondaryButton}
            onClick={() =>
              navigate(
                hasTableContext
                  ? buildOrderHistoryPath(storeId, tableNum)
                  : "/",
              )
            }
          >
            주문 내역
          </button>
          <button
            type="button"
            className={styles.orderStatus__menuButton}
            onClick={() =>
              navigate(
                hasTableContext ? buildStoreHomePath(storeId, tableNum) : "/",
              )
            }
          >
            메뉴판으로
          </button>
        </div>
      </BottomActionBar>
    </main>
  );
}
