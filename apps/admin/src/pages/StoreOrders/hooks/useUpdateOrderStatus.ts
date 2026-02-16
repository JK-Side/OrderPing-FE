import { patchOrderStatus } from '@order-ping/shared/api/order';
import { useMutation } from '@tanstack/react-query';
import type { OrderResponse, UpdateOrderStatusRequest } from '@order-ping/shared/api/order/entity';

interface UpdateOrderStatusVariables {
  id: number;
  body: UpdateOrderStatusRequest;
}

export const useUpdateOrderStatus = () => {
  return useMutation<OrderResponse, Error, UpdateOrderStatusVariables>({
    mutationFn: ({ id, body }) => patchOrderStatus(id, body),
  });
};
