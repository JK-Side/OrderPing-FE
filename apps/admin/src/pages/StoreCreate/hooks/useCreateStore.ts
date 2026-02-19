import { useMutation } from '@tanstack/react-query';
import { postCreatedStore } from '@/api/store';
import type { CreatedStoreRequest, CreatedStoreResponse } from '@/api/store/entity';

export const useCreateStore = () => {
  return useMutation<CreatedStoreResponse, Error, CreatedStoreRequest>({
    mutationFn: postCreatedStore,
  });
};
