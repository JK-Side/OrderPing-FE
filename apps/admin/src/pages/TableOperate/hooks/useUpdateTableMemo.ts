import { useMutation } from '@tanstack/react-query';
import { putTableMemo } from '@/api/table';
import type { TableResponse, UpdateTableMemoRequest } from '@/api/table/entity';

export const useUpdateTableMemo = () => {
  return useMutation<TableResponse, Error, { tableId: number; body: UpdateTableMemoRequest }>({
    mutationFn: ({ tableId, body }) => putTableMemo(tableId, body),
  });
};
