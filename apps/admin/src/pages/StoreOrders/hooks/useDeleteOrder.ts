import { deleteOrderById } from '@order-ping/shared/api/order';
import { useMutation } from '@tanstack/react-query';

export const useDeleteOrder = () => {
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteOrderById(id),
  });
};
