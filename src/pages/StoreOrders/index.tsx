import InfoIcon from '@/assets/icons/info-circle.svg?react';
import OrderLookupCard from '@/components/OrderLookupCard';
import { orderLookupMock } from '@/mocks/orderLookup';
import styles from './StoreOrders.module.scss';

type OrderCardData = {
  id: string;
  tableNumber: number;
  depositorName: string;
  depositAmount: number;
  couponAmount?: number;
};

type OrderSection = {
  key: string;
  title: string;
  hint?: string;
  orders: OrderCardData[];
};

type OrderSectionConfig = {
  key: string;
  title: string;
  hint?: string;
  statuses: string[];
};

const ORDER_SECTION_CONFIGS: OrderSectionConfig[] = [
  {
    key: 'payment',
    title: '결제 확인 전',
    hint: '입금자명과 입금 금액을 비교해 주세요!',
    statuses: ['PENDING'],
  },
  {
    key: 'cooking',
    title: '조리 중',
    statuses: ['COOKING'],
  },
  {
    key: 'served',
    title: '서빙 완료',
    statuses: ['SERVED'],
  },
];

const createOrderSections = (orders: typeof orderLookupMock): OrderSection[] =>
  ORDER_SECTION_CONFIGS.map((config) => ({
    key: config.key,
    title: config.title,
    hint: config.hint,
    orders: orders
      .filter((order) => config.statuses.includes(order.status))
      .map((order) => ({
        id: `${config.key}-${order.id}`,
        tableNumber: order.tableId,
        depositorName: order.depositorName,
        depositAmount: order.cashAmount,
        couponAmount: order.couponAmount,
      })),
  }));

export default function StoreOrders() {
  const orderSections = createOrderSections(orderLookupMock);

  return (
    <section className={styles.storeOrders}>
      <div className={styles.panel}>
        {orderSections.map((section) => (
          <div key={section.key} className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>{section.title}</div>
              {section.hint ? (
                <span className={styles.sectionHint}>
                  <InfoIcon className={styles.sectionHintIcon} aria-hidden="true" />
                  {section.hint}
                </span>
              ) : null}
            </div>

            <div className={styles.sectionDivider} />

            <div className={styles.cardGrid}>
              {section.orders.map((order) => (
                <OrderLookupCard
                  key={order.id}
                  tableNumber={order.tableNumber}
                  depositorName={order.depositorName}
                  depositAmount={order.depositAmount}
                  couponAmount={order.couponAmount}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
