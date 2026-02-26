import { getCustomerOrdersByTableId } from '../../api/customer';
import type { CustomerOrderLookupResponse } from '../../api/customer/entity';
import { useCart } from '../../stores/cart';
import { useQuery } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './OrderComplete.module.scss';

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

export default function OrderCompletePage() {
  const navigate = useNavigate();
  const { setActiveTable } = useCart();
  const [searchParams] = useSearchParams();
  const storeId = searchParams.get('storeId');
  const tableNum = searchParams.get('tableNum');

  const storeIdNumber = useMemo(() => {
    const parsed = Number(storeId);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [storeId]);

  const tableNumNumber = useMemo(() => {
    const parsed = Number(tableNum);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
  }, [tableNum]);

  const hasTableContext = storeIdNumber !== null && tableNumNumber !== null;

  const { data, isLoading, error } = useQuery({
    queryKey: ['customer', 'orders', 'complete-page', storeIdNumber, tableNumNumber],
    queryFn: () => getCustomerOrdersByTableId(storeIdNumber as number, tableNumNumber as number),
    enabled: hasTableContext,
  });

  useEffect(() => {
    setActiveTable(tableNumNumber);
  }, [setActiveTable, tableNumNumber]);

  const orders = useMemo(
    () =>
      [...(data ?? [])].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [data],
  );

  const totalMenuCount = useMemo(
    () => orders.reduce((sum, order) => sum + order.menus.reduce((m, menu) => m + menu.quantity, 0), 0),
    [orders],
  );

  const totalPaidAmount = useMemo(
    () => orders.reduce((sum, order) => sum + getPaidAmount(order), 0),
    [orders],
  );

  const backToMenu = () => {
    navigate(hasTableContext ? `/stores/${storeIdNumber}?tableNum=${tableNumNumber}` : '/');
  };

  const hasNotFoundError = (error as { status?: number } | null)?.status === 404;

  return (
    <main className={styles.orderComplete}>
      <section className={styles.orderComplete__content}>
        <header className={styles.orderComplete__hero}>
          <h1 className={styles.orderComplete__title}>주문을 완료했어요 👍</h1>
          <p className={styles.orderComplete__summary}>
            {`총 ${totalMenuCount}개 | ${formatPrice(totalPaidAmount)}`}
          </p>
        </header>

        {!hasTableContext ? (
          <div className={styles.orderComplete__status}>테이블 정보를 확인할 수 없어요.</div>
        ) : null}

        {hasTableContext && isLoading ? (
          <div className={styles.orderComplete__status}>주문 내역을 불러오는 중...</div>
        ) : null}

        {hasTableContext && !isLoading && hasNotFoundError ? (
          <div className={styles.orderComplete__status}>주문 내역이 없어요.</div>
        ) : null}

        {hasTableContext && !isLoading && !hasNotFoundError && error ? (
          <div className={styles.orderComplete__status}>주문 내역을 불러오지 못했어요.</div>
        ) : null}

        {hasTableContext && !isLoading && !error ? (
          <section className={styles.orderComplete__list}>
            {orders.length === 0 ? (
              <div className={styles.orderComplete__status}>아직 주문 내역이 없어요.</div>
            ) : (
              orders.map((order) => (
                <article key={order.id} className={styles.orderComplete__orderCard}>
                  <div className={styles.orderComplete__orderHeader}>
                    <span className={styles.orderComplete__orderNumber}>
                      {`주문 번호 ${String(order.id).padStart(2, '0')}`}
                    </span>
                    <span className={styles.orderComplete__orderTime}>
                      {formatOrderTime(order.createdAt)}
                    </span>
                  </div>

                  <div className={styles.orderComplete__menuList}>
                    {order.menus.map((menu) => (
                      <div key={`${order.id}-${menu.menuId}`} className={styles.orderComplete__menuLine}>
                        {`${menu.menuName} x ${menu.quantity}`}
                      </div>
                    ))}
                  </div>

                  <div className={styles.orderComplete__orderPrice}>
                    {formatPrice(getPaidAmount(order))}
                  </div>
                </article>
              ))
            )}
          </section>
        ) : null}
      </section>

      <footer className={styles.orderComplete__bottom}>
        <button type="button" className={styles.orderComplete__menuButton} onClick={backToMenu}>
          메뉴판으로
        </button>
      </footer>
    </main>
  );
}
