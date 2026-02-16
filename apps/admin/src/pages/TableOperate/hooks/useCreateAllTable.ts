import { postCreatedAllTable } from '@order-ping/shared/api/table';
import { useMutation } from '@tanstack/react-query';
import type { AllTableListResponse, CreateAllTableRequest } from '@order-ping/shared/api/table/entity';

export const useCreateAllTable = () => {
  return useMutation<AllTableListResponse, Error, CreateAllTableRequest>({
    mutationFn: postCreatedAllTable,
  });
};
