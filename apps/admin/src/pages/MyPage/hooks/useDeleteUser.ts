import { useMutation } from '@tanstack/react-query';
import { deleteUser } from '@/api/user';

export const useDeleteUser = () => {
  return useMutation<void, Error, void>({
    mutationFn: () => deleteUser(),
  });
};
