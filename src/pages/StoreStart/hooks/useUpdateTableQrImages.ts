import { useMutation } from '@tanstack/react-query';
import { patchTableQrImages } from '@/api/table';
import type { UpdateTableQrImagesRequest } from '@/api/table/entity';

export const useUpdateTableQrImages = (storeId: number) => {
  return useMutation<void, Error, UpdateTableQrImagesRequest>({
    mutationFn: (body) => patchTableQrImages(storeId, body),
  });
};
