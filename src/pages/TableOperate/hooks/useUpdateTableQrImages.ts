import { useMutation } from '@tanstack/react-query';
import { patchTableQrImages } from '@/api/table';
import type { AllTableListResponse, UpdateTableQrImagesRequest } from '@/api/table/entity';

export const useUpdateTableQrImages = (storeId: number) => {
  return useMutation<AllTableListResponse, Error, UpdateTableQrImagesRequest>({
    mutationFn: (body) => patchTableQrImages(storeId, body),
  });
};
