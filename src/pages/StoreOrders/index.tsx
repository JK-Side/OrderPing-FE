import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import type { OrderLookupResponse, OrderStatus } from '@/api/order/entity';
import InfoIcon from '@/assets/icons/info-circle.svg?react';
import OrderLookupCard from '@/components/OrderLookupCard';
import { useToast } from '@/components/Toast/useToast';
import OrderDetailModal from '@/pages/StoreOrders/components/OrderDetailModal';
import OrderRejectModal from '@/pages/StoreOrders/components/OrderRejectModal';
import { useDeleteOrder } from '@/pages/StoreOrders/hooks/useDeleteOrder';
import { useOrderById } from '@/pages/StoreOrders/hooks/useOrderById';
import { useOrdersByStore } from '@/pages/StoreOrders/hooks/useOrdersByStore';
import { useUpdateOrderStatus } from '@/pages/StoreOrders/hooks/useUpdateOrderStatus';
import { useTablesByStore } from '@/pages/TableOperate/hooks/useTablesByStore';
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
    key: 'pending',
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
  ORDER_SECTION_CONFIGS.map((config) => {
    const sectionOrders = orders
      .filter((order) => config.statuses.includes(order.status))
      .map((order) => ({
        id: `${config.key}-${order.id}`,
        orderId: order.id,
        tableNumber: order.tableNum,
        depositorName: order.depositorName,
        depositAmount: order.cashAmount,
        couponAmount: order.couponAmount,
        status: order.status,
      }));

    const ordered = config.key === 'served' ? [...sectionOrders].reverse() : sectionOrders;

    return {
      key: config.key,
      title: config.title,
      hint: config.hint,
      emptyLabel: config.emptyLabel,
      orders: ordered,
    };
  });

export default function StoreOrders() {
  const { id } = useParams();
  const parsedId = id ? Number(id) : undefined;
  const storeId = Number.isFinite(parsedId) ? parsedId : undefined;
  const queryClient = useQueryClient();
  const { data: orders = [] } = useOrdersByStore(storeId);
  const { data: closedTables = [] } = useTablesByStore(storeId, 'CLOSED');
  const closedTableIds = new Set(closedTables.map((table) => table.id));
  const visibleOrders = orders.filter((order) => !closedTableIds.has(order.tableId));
  const orderSections = createOrderSections(visibleOrders);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);
  const { data: orderDetail } = useOrderById(selectedOrderId ?? undefined);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [pendingRejectOrder, setPendingRejectOrder] = useState<OrderCardData | null>(null);
  const [acceptingOrderId, setAcceptingOrderId] = useState<number | null>(null);
  const [revertingOrderId, setRevertingOrderId] = useState<number | null>(null);
  const [cancelingOrderId, setCancelingOrderId] = useState<number | null>(null);
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

  const handleCancelService = async (order: OrderCardData) => {
    if (cancelingOrderId === order.orderId) return;

    try {
      setCancelingOrderId(order.orderId);
      await deleteOrder(order.orderId);

      if (storeId) {
        queryClient.setQueryData<OrderLookupResponse[]>(['orders', storeId], (prev) =>
          prev ? prev.filter((item) => item.id !== order.orderId) : prev,
        );
      }

      toast({
        message: '주문이 취소되었습니다.',
        variant: 'success',
      });
    } catch (error) {
      toast({
        message: '주문 취소에 실패했습니다.',
        description: error instanceof Error ? error.message : undefined,
        variant: 'error',
      });
      console.error('주문 취소에 실패했습니다.', error);
    } finally {
      setCancelingOrderId(null);
    }
  };

  const resolveNextStatus = (status: OrderStatus) => {
    if (status === 'PENDING') return 'COOKING';
    if (status === 'COOKING') return 'COMPLETE';
    return status;
  };

  const resolvePrevStatus = (status: OrderStatus) => {
    if (status === 'COMPLETE') return 'COOKING';
    if (status === 'COOKING') return 'PENDING';
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

  const handlePrev = async (order: OrderCardData) => {
    if (order.status === 'PENDING') return;
    if (revertingOrderId === order.orderId) return;
    const prevStatus = resolvePrevStatus(order.status);

    try {
      setRevertingOrderId(order.orderId);
      await updateOrderStatus({
        id: order.orderId,
        body: { status: prevStatus },
      });

      if (storeId) {
        queryClient.setQueryData<OrderLookupResponse[]>(['orders', storeId], (prev) =>
          prev ? prev.map((item) => (item.id === order.orderId ? { ...item, status: prevStatus } : item)) : prev,
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
      setRevertingOrderId((prev) => (prev === order.orderId ? null : prev));
    }
  };

  const selectedOrder = selectedOrderId
    ? (visibleOrders.find((order) => order.id === selectedOrderId) ?? null)
    : null;

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
                section.orders.map((order) => {
                  const isServiceOrder = order.depositorName === '서비스';
                  return (
                    <OrderLookupCard
                      key={order.id}
                      tableNumber={order.tableNumber}
                      depositorName={order.depositorName}
                      depositAmount={order.depositAmount}
                      couponAmount={order.couponAmount}
                      onDetailClick={() => handleOpenDetail(order.orderId)}
                      onPrev={() => handlePrev(order)}
                      onReject={() => handleOpenReject(order)}
                      onCancel={isServiceOrder ? () => handleCancelService(order) : undefined}
                      onAccept={() => handleAccept(order)}
                      isAccepting={acceptingOrderId === order.orderId}
                      isReverting={
                        isServiceOrder ? cancelingOrderId === order.orderId : revertingOrderId === order.orderId
                      }
                      isAcceptDisabled={!storeId || order.status === 'COMPLETE'}
                      stat={order.status}
                    />
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
      <OrderDetailModal
        open={isDetailOpen}
        onOpenChange={handleDetailOpenChange}
        order={orderDetail ?? selectedOrder}
        menus={orderDetail?.menus ?? []}
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
