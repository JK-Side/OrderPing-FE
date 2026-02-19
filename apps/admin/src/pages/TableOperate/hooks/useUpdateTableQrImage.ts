import { useMutation } from '@tanstack/react-query';
import { patchTableQrImage } from '@/api/table';
import type { TableResponse, UpdateTableQrImageRequest } from '@/api/table/entity';

export const useUpdateTableQrImage = () => {
  return useMutation<TableResponse, Error, { tableId: number; body: UpdateTableQrImageRequest }>({
    mutationFn: ({ tableId, body }) => patchTableQrImage(tableId, body),
  });
};
