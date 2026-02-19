import { useMutation } from '@tanstack/react-query';
import { putStoreById } from '@/api/store';
import type { StoreDetailResponse, UpdateStoreRequest } from '@/api/store/entity';

interface UpdateStoreVariables {
  storeId: number;
  body: UpdateStoreRequest;
}

export const useUpdateStore = () => {
  return useMutation<StoreDetailResponse, Error, UpdateStoreVariables>({
    mutationFn: ({ storeId, body }) => putStoreById(storeId, body),
  });
};
