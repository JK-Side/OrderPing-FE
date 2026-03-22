import { useQuery } from '@tanstack/react-query';
import { getUserInfo } from '@/api/auth';
import { useAuth } from '@/utils/hooks/useAuth';

interface UseUserInfoOptions {
  enabled?: boolean;
}

export const useUserInfo = (options: UseUserInfoOptions = {}) => {
  const { token, authStatus } = useAuth();
  const enabled = (options.enabled ?? true) && authStatus === 'authed' && !!token;

  return useQuery({
    queryKey: ['userInfo'],
    queryFn: getUserInfo,
    enabled,
  });
};
