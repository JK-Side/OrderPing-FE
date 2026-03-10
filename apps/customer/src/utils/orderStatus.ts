import type { OrderStatus } from '../api/customer/entity';

export type OrderStatusTone = 'red' | 'green' | 'blue';

export interface OrderStatusMeta {
  label: string;
  description: string;
  stepIndex: number;
  tone: OrderStatusTone;
}

export const ORDER_STATUS_META: Record<OrderStatus, OrderStatusMeta> = {
  PENDING: {
    label: '결제 확인 전',
    description: '주점에서 결제를 확인하고 있어요!',
    stepIndex: 0,
    tone: 'red',
  },
  COOKING: {
    label: '조리 중',
    description: '주문하신 음식이 조리 중입니다.',
    stepIndex: 1,
    tone: 'green',
  },
  COMPLETE: {
    label: '서빙 완료',
    description: '서빙이 완료되었어요.',
    stepIndex: 2,
    tone: 'blue',
  },
};

export const ORDER_STATUS_STEPS: OrderStatus[] = ['PENDING', 'COOKING', 'COMPLETE'];

export const getOrderStatusMeta = (status: OrderStatus) => ORDER_STATUS_META[status];
