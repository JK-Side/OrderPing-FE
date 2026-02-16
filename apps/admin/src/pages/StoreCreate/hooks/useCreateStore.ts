import { postCreatedStore } from '@order-ping/shared/api/store';
import { useMutation } from '@tanstack/react-query';
import type { CreatedStoreRequest, CreatedStoreResponse } from '@order-ping/shared/api/store/entity';

export const useCreateStore = () => {
  return useMutation<CreatedStoreResponse, Error, CreatedStoreRequest>({
    mutationFn: postCreatedStore,
  });
};
