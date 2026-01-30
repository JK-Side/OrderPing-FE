import { useMutation } from '@tanstack/react-query';
import { deleteOrderById } from '@/api/order';

export const useDeleteOrder = () => {
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteOrderById(id),
  });
};
