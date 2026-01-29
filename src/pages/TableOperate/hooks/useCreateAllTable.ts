import { useMutation } from '@tanstack/react-query';
import { postCreatedAllTable } from '@/api/table';
import type { AllTableListResponse, CreateAllTableRequest } from '@/api/table/entity';

export const useCreateAllTable = () => {
  return useMutation<AllTableListResponse, Error, CreateAllTableRequest>({
    mutationFn: postCreatedAllTable,
  });
};
