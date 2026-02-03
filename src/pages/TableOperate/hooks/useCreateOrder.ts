import { useMutation } from '@tanstack/react-query';
import { postCreateOrder } from '@/api/order';
import type { CreateOrderRequest, OrderResponse } from '@/api/order/entity';

export const useCreateOrder = () => {
  return useMutation<OrderResponse, Error, CreateOrderRequest>({
    mutationFn: (body) => postCreateOrder(body),
  });
};
