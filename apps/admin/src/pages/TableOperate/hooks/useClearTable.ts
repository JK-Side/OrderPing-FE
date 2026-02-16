import { postClearTable } from '@order-ping/shared/api/table';
import { useMutation } from '@tanstack/react-query';
import type { TableResponse } from '@order-ping/shared/api/table/entity';

export const useClearTable = () => {
  return useMutation<TableResponse, Error, number>({
    mutationFn: (tableId) => postClearTable(tableId),
  });
};
