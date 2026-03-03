import { useQuery } from '@tanstack/react-query';
import { getMyPage } from '@/api/user';
import { useAuth } from '@/utils/hooks/useAuth';

export const useMyPage = () => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['myPage'],
    queryFn: getMyPage,
    enabled: !!token,
  });
};
