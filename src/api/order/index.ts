import { apiClient } from '..';
import type {
  CreateOrderRequest,
  OrderDetailResponse,
  OrderResponse,
  OrderStatusQuery,
  ServiceOrderRequest,
  ServiceOrderResponse,
  UpdateOrderStatusRequest,
} from './entity';

export const getOrdersByStore = async (storeId: number, status?: OrderStatusQuery) => {
  return await apiClient.get<OrderResponse[]>('/api/orders', {
    params: status ? { storeId, status } : { storeId },
  });
};

export const patchOrderStatus = async (id: number, body: UpdateOrderStatusRequest) => {
  return await apiClient.patch<OrderResponse>(`/api/orders/${id}/status`, {
    body,
  });
};

export const postCreateOrder = async (body: CreateOrderRequest) => {
  return await apiClient.post<OrderResponse>('/api/orders', {
    body,
  });
};

export const getOrderById = async (id: number) => {
  return await apiClient.get<OrderDetailResponse>(`/api/orders/${id}`);
};

export const deleteOrderById = async (id: number) => {
  return await apiClient.delete<void>(`/api/orders/${id}`);
};


export const postCreateService = async (body: ServiceOrderRequest) => {
  return await apiClient.post<ServiceOrderResponse>('/api/orders/service', {
    body,
  });
};
