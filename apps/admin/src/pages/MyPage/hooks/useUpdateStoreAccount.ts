import { useMutation } from '@tanstack/react-query';
import { putStoreAccountById } from '@/api/storeAccount';
import type { StoreAccountResponse, UpdateStoreAccountRequest } from '@/api/storeAccount/entity';

interface UpdateStoreAccountVariables {
  accountId: number;
  body: UpdateStoreAccountRequest;
}

export const useUpdateStoreAccount = () => {
  return useMutation<StoreAccountResponse, Error, UpdateStoreAccountVariables>({
    mutationFn: ({ accountId, body }) => putStoreAccountById(accountId, body),
  });
};
