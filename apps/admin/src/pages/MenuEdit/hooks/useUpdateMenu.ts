import { useMutation } from '@tanstack/react-query';
import { putMenuById } from '@/api/menu';
import type { UpdateMenuRequest, UpdateMenuResponse } from '@/api/menu/entity';

interface UpdateMenuVariables {
  menuId: number;
  body: UpdateMenuRequest;
}

export const useUpdateMenu = () => {
  return useMutation<UpdateMenuResponse, Error, UpdateMenuVariables>({
    mutationFn: ({ menuId, body }) => putMenuById(menuId, body),
  });
};
