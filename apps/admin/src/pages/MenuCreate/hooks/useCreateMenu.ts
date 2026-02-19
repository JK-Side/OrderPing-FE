import { useMutation } from '@tanstack/react-query';
import { postCreatedMenu } from '@/api/menu';
import type { CreateMenuRequest, CreateMenuResponse } from '@/api/menu/entity';

export const useCreateMenu = () => {
  return useMutation<CreateMenuResponse, Error, CreateMenuRequest>({
    mutationFn: postCreatedMenu,
  });
};
