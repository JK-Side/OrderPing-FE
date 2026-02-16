import { patchTableQrImages } from '@order-ping/shared/api/table';
import { useMutation } from '@tanstack/react-query';
import type { AllTableListResponse, UpdateTableQrImagesRequest } from '@order-ping/shared/api/table/entity';

export const useUpdateTableQrImages = (storeId: number) => {
  return useMutation<AllTableListResponse, Error, UpdateTableQrImagesRequest>({
    mutationFn: (body) => patchTableQrImages(storeId, body),
  });
};
