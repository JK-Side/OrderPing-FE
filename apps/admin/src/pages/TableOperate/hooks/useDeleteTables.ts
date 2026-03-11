import { useMutation } from '@tanstack/react-query';
import { deleteTablesBulk } from '@/api/table';
import type { BulkTableOperationRequest } from '@/api/table/entity';

export const useDeleteTables = () => {
  return useMutation<void, Error, BulkTableOperationRequest>({
    mutationFn: deleteTablesBulk,
  });
};
