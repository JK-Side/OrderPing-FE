import { useMutation } from '@tanstack/react-query';
import { postClearTablesBulk } from '@/api/table';
import type { BulkTableOperationRequest, TableListResponse } from '@/api/table/entity';

export const useClearTables = () => {
  return useMutation<TableListResponse, Error, BulkTableOperationRequest>({
    mutationFn: postClearTablesBulk,
  });
};
