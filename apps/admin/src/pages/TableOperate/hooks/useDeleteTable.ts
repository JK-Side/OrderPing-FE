import { useMutation } from '@tanstack/react-query';
import { deleteTableById } from '@/api/table';

export const useDeleteTable = () => {
  return useMutation<void, Error, number>({
    mutationFn: (tableId) => deleteTableById(tableId),
  });
};
