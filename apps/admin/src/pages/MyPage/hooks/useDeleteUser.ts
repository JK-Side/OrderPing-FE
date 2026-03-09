import { useMutation } from '@tanstack/react-query';
import { deleteUserById } from '@/api/user';

export const useDeleteUser = () => {
  return useMutation<void, Error, number>({
    mutationFn: (id) => deleteUserById(id),
  });
};
