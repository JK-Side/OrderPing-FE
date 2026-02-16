import { postCreatedTable } from '@order-ping/shared/api/table';
import { useMutation } from '@tanstack/react-query';
import type { CreateTableRequest, TableResponse } from '@order-ping/shared/api/table/entity';

export const useCreateTable = () => {
  return useMutation<TableResponse, Error, CreateTableRequest>({
    mutationFn: postCreatedTable,
  });
};
