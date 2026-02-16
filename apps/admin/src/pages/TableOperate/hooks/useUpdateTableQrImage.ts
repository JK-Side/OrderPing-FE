import { patchTableQrImage } from '@order-ping/shared/api/table';
import { useMutation } from '@tanstack/react-query';
import type { TableResponse, UpdateTableQrImageRequest } from '@order-ping/shared/api/table/entity';

export const useUpdateTableQrImage = () => {
  return useMutation<TableResponse, Error, { tableId: number; body: UpdateTableQrImageRequest }>({
    mutationFn: ({ tableId, body }) => patchTableQrImage(tableId, body),
  });
};
