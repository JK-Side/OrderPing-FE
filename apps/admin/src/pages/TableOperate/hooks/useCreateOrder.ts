import { postCreateOrder } from '@order-ping/shared/api/order';
import { useMutation } from '@tanstack/react-query';
import type { CreateOrderRequest, OrderResponse } from '@order-ping/shared/api/order/entity';

export const useCreateOrder = () => {
  return useMutation<OrderResponse, Error, CreateOrderRequest>({
    mutationFn: (body) => postCreateOrder(body),
  });
};
