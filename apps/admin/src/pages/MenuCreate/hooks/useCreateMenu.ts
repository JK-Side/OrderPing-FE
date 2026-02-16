import { postCreatedMenu } from '@order-ping/shared/api/menu';
import { useMutation } from '@tanstack/react-query';
import type { CreateMenuRequest, CreateMenuResponse } from '@order-ping/shared/api/menu/entity';

export const useCreateMenu = () => {
  return useMutation<CreateMenuResponse, Error, CreateMenuRequest>({
    mutationFn: postCreatedMenu,
  });
};
