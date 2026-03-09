import { useMutation } from '@tanstack/react-query';
import { deleteStoreById } from '@/api/store';

export const useDeleteStore = () => {
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteStoreById(id),
  });
};
