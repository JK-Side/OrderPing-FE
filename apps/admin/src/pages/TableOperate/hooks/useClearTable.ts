import { useMutation } from '@tanstack/react-query';
import { postClearTable } from '@/api/table';
import type { TableResponse } from '@/api/table/entity';

export const useClearTable = () => {
  return useMutation<TableResponse, Error, number>({
    mutationFn: (tableId) => postClearTable(tableId),
  });
};
