import { apiClient } from '..';
import type { OrderDetailResponse, OrderResponse, OrderStatusQuery, UpdateOrderStatusRequest } from './entity';

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

export const getOrderById = async (id: number) => {
  return await apiClient.get<OrderDetailResponse>(`/api/orders/${id}`);
};

export const deleteOrderById = async (id: number) => {
  return await apiClient.delete<void>(`/api/orders/${id}`);
};
