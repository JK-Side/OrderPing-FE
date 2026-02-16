import { getUserInfo } from '@order-ping/shared/api/auth';
import { useAuth } from '@order-ping/shared/utils/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export const useUserInfo = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['userInfo'],
    queryFn: getUserInfo,
    enabled: !!token,
  });
};
