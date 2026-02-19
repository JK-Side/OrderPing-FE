import { useMutation } from '@tanstack/react-query';
import { patchOrderStatus } from '@/api/order';
import type { OrderResponse, UpdateOrderStatusRequest } from '@/api/order/entity';

interface UpdateOrderStatusVariables {
  id: number;
  body: UpdateOrderStatusRequest;
}

export const useUpdateOrderStatus = () => {
  return useMutation<OrderResponse, Error, UpdateOrderStatusVariables>({
    mutationFn: ({ id, body }) => patchOrderStatus(id, body),
  });
};
