import { putMenuById } from '@order-ping/shared/api/menu';
import { useMutation } from '@tanstack/react-query';
import type { UpdateMenuRequest, UpdateMenuResponse } from '@order-ping/shared/api/menu/entity';

interface UpdateMenuVariables {
  menuId: number;
  body: UpdateMenuRequest;
}

export const useUpdateMenu = () => {
  return useMutation<UpdateMenuResponse, Error, UpdateMenuVariables>({
    mutationFn: ({ menuId, body }) => putMenuById(menuId, body),
  });
};
