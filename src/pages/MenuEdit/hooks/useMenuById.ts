import { useQuery } from '@tanstack/react-query';
import { getMenuById } from '@/api/menu';
import { useAuth } from '@/utils/hooks/useAuth';

export const useMenuById = (menuId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['menu', menuId],
    queryFn: () => getMenuById(menuId as number),
    enabled: !!token && !!menuId,
  });
};
