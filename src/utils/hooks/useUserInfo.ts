import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '@/api/auth';
import { useAuth } from '@/utils/hooks/useAuth';

export const useUserInfo = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['userInfo'],
    queryFn: getUserInfo,
    enabled: !!token,
  });
};
