import { putStoreById } from '@order-ping/shared/api/store';
import { useMutation } from '@tanstack/react-query';
import type { StoreDetailResponse, UpdateStoreRequest } from '@order-ping/shared/api/store/entity';

interface UpdateStoreVariables {
  storeId: number;
  body: UpdateStoreRequest;
}

export const useUpdateStore = () => {
  return useMutation<StoreDetailResponse, Error, UpdateStoreVariables>({
    mutationFn: ({ storeId, body }) => putStoreById(storeId, body),
  });
};
