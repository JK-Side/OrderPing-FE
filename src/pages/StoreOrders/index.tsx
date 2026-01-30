import { useState } from 'react';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import OrderLookupCard from '@/components/OrderLookupCard';
import { orderLookupMock } from '@/mocks/orderLookup';
import OrderDetailModal, { type OrderDetailItem } from '@/pages/StoreOrders/components/OrderDetailModal';
import OrderRejectModal from '@/pages/StoreOrders/components/OrderRejectModal';
import styles from './StoreOrders.module.scss';

type OrderCardData = {
  id: string;
  orderId: number;
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
        orderId: order.id,
        tableNumber: order.tableId,
        depositorName: order.depositorName,
        depositAmount: order.cashAmount,
        couponAmount: order.couponAmount,
      })),
  }));

const DEFAULT_DETAIL_ITEMS: OrderDetailItem[] = [
  {
    name: '하츄핑의 특제 핑크퐁이 아닌 핑크탕',
    quantity: 2,
    price: 49000,
  },
  {
    name: '바로핑의 특제 치킨 갈릭 소스',
    quantity: 14,
    price: 143000,
  },
  {
    name: '오로라핑의 아름다운 무지개 전골',
    quantity: 1,
    price: 16000,
  },
  {
    name: '궁금핑이 만든 요리가 궁금하신가요? 그러기 위해...',
    quantity: 1,
    price: 8000,
  },
];

const ORDER_DETAIL_ITEMS: Record<number, OrderDetailItem[]> = {
  1: DEFAULT_DETAIL_ITEMS,
};

export default function StoreOrders() {
  const orderSections = createOrderSections(orderLookupMock);
  const [selectedOrder, setSelectedOrder] = useState<(typeof orderLookupMock)[number] | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [pendingRejectOrder, setPendingRejectOrder] = useState<OrderCardData | null>(null);

  const handleOpenDetail = (orderId: number) => {
    const nextOrder = orderLookupMock.find((order) => order.id === orderId) ?? null;
    setSelectedOrder(nextOrder);
    setIsDetailOpen(true);
  };

  const handleDetailOpenChange = (nextOpen: boolean) => {
    setIsDetailOpen(nextOpen);
    if (!nextOpen) {
      setSelectedOrder(null);
    }
  };

  const handleOpenReject = (order: OrderCardData) => {
    setPendingRejectOrder(order);
    setIsRejectOpen(true);
  };

  const handleRejectOpenChange = (nextOpen: boolean) => {
    setIsRejectOpen(nextOpen);
    if (!nextOpen) {
      setPendingRejectOrder(null);
    }
  };

  const handleConfirmReject = () => {
    if (!pendingRejectOrder) return;
    setPendingRejectOrder(null);
  };

  const detailItems = selectedOrder ? ORDER_DETAIL_ITEMS[selectedOrder.id] ?? DEFAULT_DETAIL_ITEMS : DEFAULT_DETAIL_ITEMS;

  return (
    <section className={styles.storeOrders}>
      <div className={styles.panel}>
        {orderSections.map((section) => (
          <div key={section.key} className={styles.section}>
            <div className={styles.sectionHeader}>
              <div className={styles.sectionTitle}>{section.title}</div>
              {section.hint ? (
                <span className={styles.sectionHint}>
                  <InfoIcon width={16} height={16} aria-hidden="true" />
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
                  onDetailClick={() => handleOpenDetail(order.orderId)}
                  onReject={() => handleOpenReject(order)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <OrderDetailModal
        open={isDetailOpen}
        onOpenChange={handleDetailOpenChange}
        order={selectedOrder}
        items={detailItems}
      />
      <OrderRejectModal
        open={isRejectOpen}
        onOpenChange={handleRejectOpenChange}
        onConfirm={handleConfirmReject}
      />
    </section>
  );
}
