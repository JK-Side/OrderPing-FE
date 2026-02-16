import { deleteMenuById } from '@order-ping/shared/api/menu';
import { useMutation } from '@tanstack/react-query';

export const useDeleteMenu = () => {
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteMenuById(id),
  });
};
