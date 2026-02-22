import { useMutation } from '@tanstack/react-query';
import { postCreatedTable } from '@/api/table';
import type { CreateTableRequest, TableResponse } from '@/api/table/entity';

export const useCreateTable = () => {
  return useMutation<TableResponse, Error, CreateTableRequest>({
    mutationFn: postCreatedTable,
  });
};
