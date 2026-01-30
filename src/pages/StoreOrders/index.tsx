import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { OrderLookupResponse, OrderStatus } from '@/api/order/entity';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import OrderLookupCard from '@/components/OrderLookupCard';
import { useToast } from '@/components/Toast/useToast';
import OrderDetailModal, { type OrderDetailItem } from '@/pages/StoreOrders/components/OrderDetailModal';
import OrderRejectModal from '@/pages/StoreOrders/components/OrderRejectModal';
import { useDeleteOrder } from '@/pages/StoreOrders/hooks/useDeleteOrder';
import { useOrdersByStore } from '@/pages/StoreOrders/hooks/useOrdersByStore';
import { useUpdateOrderStatus } from '@/pages/StoreOrders/hooks/useUpdateOrderStatus';
import styles from './StoreOrders.module.scss';

type OrderCardData = {
  id: string;
  orderId: number;
  tableNumber: number;
  depositorName: string;
  depositAmount: number;
  couponAmount?: number;
  status: OrderStatus;
};

type OrderSection = {
  key: string;
  title: string;
  hint?: string;
  emptyLabel: string;
  orders: OrderCardData[];
};

type OrderSectionConfig = {
  key: string;
  title: string;
  hint?: string;
  emptyLabel: string;
  statuses: OrderStatus[];
};

const ORDER_SECTION_CONFIGS: OrderSectionConfig[] = [
  {
    key: 'payment',
    title: '결제 확인 전',
    hint: '입금자명과 입금 금액을 비교해 주세요!',
    emptyLabel: 'Pending',
    statuses: ['PENDING'],
  },
  {
    key: 'cooking',
    title: '조리 중',
    emptyLabel: 'Cooking',
    statuses: ['COOKING'],
  },
  {
    key: 'served',
    title: '서빙 완료',
    emptyLabel: 'Complete',
    statuses: ['COMPLETE'],
  },
];

const createOrderSections = (orders: OrderLookupResponse[]): OrderSection[] =>
  ORDER_SECTION_CONFIGS.map((config) => ({
    key: config.key,
    title: config.title,
    hint: config.hint,
    emptyLabel: config.emptyLabel,
    orders: orders
      .filter((order) => config.statuses.includes(order.status))
      .map((order) => ({
        id: `${config.key}-${order.id}`,
        orderId: order.id,
        tableNumber: order.tableId,
        depositorName: order.depositorName,
        depositAmount: order.cashAmount,
        couponAmount: order.couponAmount,
        status: order.status,
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
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const queryClient = useQueryClient();
  const { data: orders = [] } = useOrdersByStore(storeId);
  const orderSections = createOrderSections(orders);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [pendingRejectOrder, setPendingRejectOrder] = useState<OrderCardData | null>(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const { mutateAsync: updateOrderStatus } = useUpdateOrderStatus();
  const { mutateAsync: deleteOrder } = useDeleteOrder();
  const { toast } = useToast();

  const handleOpenDetail = (orderId: number) => {
    setSelectedOrderId(orderId);
    setIsDetailOpen(true);
  };

  const handleDetailOpenChange = (nextOpen: boolean) => {
    setIsDetailOpen(nextOpen);
    if (!nextOpen) {
      setSelectedOrderId(null);
    }
  };

  const handleOpenReject = (order: OrderCardData) => {
    setPendingRejectOrder(order);
    setIsRejectOpen(true);
  };

  const handleOpenRejectFromDetail = () => {
    if (!selectedOrder) return;

    handleOpenReject({
      id: `detail-${selectedOrder.id}`,
      orderId: selectedOrder.id,
      tableNumber: selectedOrder.tableId,
      depositorName: selectedOrder.depositorName,
      depositAmount: selectedOrder.cashAmount,
      couponAmount: selectedOrder.couponAmount,
      status: selectedOrder.status,
    });
    handleDetailOpenChange(false);
  };

  const handleRejectOpenChange = (nextOpen: boolean) => {
    setIsRejectOpen(nextOpen);
    if (!nextOpen) {
      setPendingRejectOrder(null);
      setIsDeleting(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!pendingRejectOrder) return;

    try {
      setIsDeleting(true);
      await deleteOrder(pendingRejectOrder.orderId);

      if (storeId) {
        queryClient.setQueryData<OrderLookupResponse[]>(['orders', storeId], (prev) =>
          prev ? prev.filter((item) => item.id !== pendingRejectOrder.orderId) : prev,
        );
      }

      toast({
        message: '주문이 취소되었습니다.',
        variant: 'success',
      });

      setIsRejectOpen(false);
      setPendingRejectOrder(null);
    } catch (error) {
      toast({
        message: '주문 취소에 실패했습니다.',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      console.error('주문 취소에 실패했습니다.', error);
      setIsRejectOpen(false);
      setPendingRejectOrder(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const resolveNextStatus = (status: OrderStatus) => {
    if (status === 'PENDING') return 'COOKING';
    if (status === 'COOKING') return 'COMPLETE';
    return status;
  };

  const handleAccept = async (order: OrderCardData) => {
    if (order.status === 'COMPLETE') return;
    if (acceptingOrderId === order.orderId) return;
    const nextStatus = resolveNextStatus(order.status);

    try {
      setAcceptingOrderId(order.orderId);
      await updateOrderStatus({
        id: order.orderId,
        body: { status: nextStatus },
      });

      if (storeId) {
        queryClient.setQueryData<OrderLookupResponse[]>(['orders', storeId], (prev) =>
          prev ? prev.map((item) => (item.id === order.orderId ? { ...item, status: nextStatus } : item)) : prev,
        );
      }
    } catch (error) {
      toast({
        message: '주문 상태 업데이트에 실패했습니다.',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      console.error('주문 상태 업데이트에 실패했습니다.', error);
    } finally {
      setAcceptingOrderId((prev) => (prev === order.orderId ? null : prev));
    }
  };

  const selectedOrder = selectedOrderId ? (orders.find((order) => order.id === selectedOrderId) ?? null) : null;
  const detailItems = selectedOrder
    ? (ORDER_DETAIL_ITEMS[selectedOrder.id] ?? DEFAULT_DETAIL_ITEMS)
    : DEFAULT_DETAIL_ITEMS;

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
              {section.orders.length === 0 ? (
                <div className={styles.emptyState}>No {section.emptyLabel} orders.</div>
              ) : (
                section.orders.map((order) => (
                  <OrderLookupCard
                    key={order.id}
                    tableNumber={order.tableNumber}
                    depositorName={order.depositorName}
                    depositAmount={order.depositAmount}
                    couponAmount={order.couponAmount}
                    onDetailClick={() => handleOpenDetail(order.orderId)}
                    onReject={() => handleOpenReject(order)}
                    onAccept={() => handleAccept(order)}
                    isAccepting={acceptingOrderId === order.orderId}
                    isAcceptDisabled={!storeId || order.status === 'COMPLETE'}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <OrderDetailModal
        open={isDetailOpen}
        onOpenChange={handleDetailOpenChange}
        order={selectedOrder}
        items={detailItems}
        onReject={handleOpenRejectFromDetail}
      />
      <OrderRejectModal
        open={isRejectOpen}
        onOpenChange={handleRejectOpenChange}
        onConfirm={handleConfirmReject}
        isLoading={isDeleting}
      />
    </section>
  );
}
