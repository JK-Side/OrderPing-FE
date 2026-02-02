export type OrderStatus = 'PENDING' | 'COOKING' | 'COMPLETE';
export type OrderStatusResponse = OrderStatus;
export type OrderStatusQuery = OrderStatus;

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface OrderResponse {
  id: number;
  tableId: number;
  tableNum: number;
  storeId: number;
  sessionId: string;
  depositorName: string;
  status: OrderStatusResponse;
  totalPrice: number;
  couponAmount: number;
  cashAmount: number;
  createdAt: string;
}

export interface OrderLookupResponse {
  id: number;
  tableId: number;
  storeId: number;
  depositorName: string;
  status: OrderStatus;
  totalPrice: number;
  couponAmount: number;
  cashAmount: number;
  createdAt: string;
}
