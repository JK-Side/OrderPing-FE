export type OrderStatus = 'PENDING' | 'COOKING' | 'COMPLETE';
export type OrderStatusResponse = OrderStatus;
export type OrderStatusQuery = OrderStatus;

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface CreateOrderMenuRequest {
  menuId: number;
  quantity: number;
  price: number;
  isService: boolean;
}

export interface CreateOrderRequest {
  storeId: number;
  tableId: number;
  tableNum: number;
  depositorName?: string;
  couponAmount?: number;
  menus: CreateOrderMenuRequest[];
}

export interface OrderResponse {
  id: number;
  tableId: number;
  tableNum: number;
  storeId: number;
  depositorName: string;
  status: OrderStatusResponse;
  totalPrice: number;
  couponAmount: number;
  cashAmount: number;
  createdAt: string;
}

export interface OrderMenuItem {
  menuId: number;
  menuName: string;
  quantity: number;
  price: number;
  isService: boolean;
}

export interface OrderDetailResponse extends OrderResponse {
  menus: OrderMenuItem[];
}

export interface OrderLookupResponse {
  id: number;
  tableId: number;
  tableNum: number;
  storeId: number;
  depositorName: string;
  status: OrderStatus;
  totalPrice: number;
  couponAmount: number;
  cashAmount: number;
  createdAt: string;
}

interface ServiceMenu {
  menuId: number;
  quantity: number;
}
export interface ServiceOrderRequest {
  tableId: number;
  tableNum: number;
  storeId: number;
  menus: ServiceMenu[];
}

export interface ServiceOrderResponse {
  id: number;
  tableId: number;
  tableNum: number;
  storeId: number;
  depositorName: string
  status: OrderStatus
  totalPrice: number;
  couponAmount: number;
  cashAmount: number;
  createdAt: string
}
