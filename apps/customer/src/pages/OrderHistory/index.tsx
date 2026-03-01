import { getCustomerOrdersByTableId } from '../../api/customer';
import type { CustomerOrderLookupResponse } from '../../api/customer/entity';
import { useCart } from '../../stores/cart';
import { buildStoreHomePath, parsePositiveInt } from '../../utils/orderFlow';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import styles from './OrderHistory.module.scss';

const formatPrice = (price: number) => `${price.toLocaleString('ko-KR')}원`;

const formatOrderTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '--:--';

  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

const getPaidAmount = (order: CustomerOrderLookupResponse) =>
  order.cashAmount > 0 ? order.cashAmount : order.totalPrice;

export default function OrderHistoryPage() {
  const navigate = useNavigate();
  const { setActiveTable } = useCart();
  const { storeId: storeIdParam } = useParams<{ storeId?: string }>();
  const [searchParams] = useSearchParams();
  const storeId = useMemo(() => parsePositiveInt(storeIdParam), [storeIdParam]);
  const tableNum = useMemo(() => parsePositiveInt(searchParams.get('tableNum')), [searchParams]);
  const hasTableContext = storeId !== null && tableNum !== null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', 'orders', 'history', storeId, tableNum],
    queryFn: () => getCustomerOrdersByTableId(storeId as number, tableNum as number),
    enabled: hasTableContext,
  });

  useEffect(() => {
    setActiveTable(tableNum);
  }, [setActiveTable, tableNum]);

  const orders = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  );

  const totalMenuCount = useMemo(
    () =>
      orders.reduce(
        (sum, order) => sum + order.menus.reduce((acc, menu) => acc + menu.quantity, 0),
        0,
      ),
    [orders],
  );

  const totalPaidAmount = useMemo(
    () => orders.reduce((sum, order) => sum + getPaidAmount(order), 0),
    [orders],
  );

  const hasNotFoundError = (error as { status?: number } | null)?.status === 404;

  return (
    <main className={styles.orderHistory}>
      <section className={styles.orderHistory__content}>
        <header className={styles.orderHistory__hero}>
          <h1 className={styles.orderHistory__title}>주문 내역</h1>
          <p className={styles.orderHistory__summary}>
            {`총 ${totalMenuCount}개 | ${formatPrice(totalPaidAmount)}`}
          </p>
        </header>

        {!hasTableContext ? (
          <div className={styles.orderHistory__status}>테이블 정보를 확인할 수 없어요.</div>
        ) : null}

        {hasTableContext && isLoading ? (
          <div className={styles.orderHistory__status}>주문 내역을 불러오는 중...</div>
        ) : null}

        {hasTableContext && !isLoading && hasNotFoundError ? (
          <div className={styles.orderHistory__status}>주문 내역이 없어요.</div>
        ) : null}

        {hasTableContext && !isLoading && !hasNotFoundError && error ? (
          <div className={styles.orderHistory__status}>주문 내역을 불러오지 못했어요.</div>
        ) : null}

        {hasTableContext && !isLoading && !error ? (
          <section className={styles.orderHistory__list}>
            {orders.length === 0 ? (
              <div className={styles.orderHistory__status}>아직 주문 내역이 없어요.</div>
            ) : (
              orders.map((order) => (
                <article key={order.id} className={styles.orderHistory__orderCard}>
                  <div className={styles.orderHistory__orderHeader}>
                    <span className={styles.orderHistory__orderNumber}>
                      {`주문 번호 ${String(order.id).padStart(2, '0')}`}
                    </span>
                    <span className={styles.orderHistory__orderTime}>
                      {formatOrderTime(order.createdAt)}
                    </span>
                  </div>

                  <div className={styles.orderHistory__menuList}>
                    {order.menus.map((menu) => (
                      <div key={`${order.id}-${menu.menuId}`} className={styles.orderHistory__menuLine}>
                        {`${menu.menuName} x ${menu.quantity}`}
                      </div>
                    ))}
                  </div>

                  <div className={styles.orderHistory__orderPrice}>
                    {formatPrice(getPaidAmount(order))}
                  </div>
                </article>
              ))
            )}
          </section>
        ) : null}
      </section>

      <footer className={styles.orderHistory__bottom}>
        <button
          type="button"
          className={styles.orderHistory__menuButton}
          onClick={() => navigate(hasTableContext ? buildStoreHomePath(storeId, tableNum) : '/')}
        >
          메뉴판으로
        </button>
      </footer>
    </main>
  );
}
