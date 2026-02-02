import { useMutation } from '@tanstack/react-query';
import { deleteMenuById } from '@/api/menu';

export const useDeleteMenu = () => {
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteMenuById(id),
  });
};
