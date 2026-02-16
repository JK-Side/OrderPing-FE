import { getMenuById } from '@order-ping/shared/api/menu';
import { useAuth } from '@order-ping/shared/utils/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export const useMenuById = (menuId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['menu', menuId],
    queryFn: () => getMenuById(menuId as number),
    enabled: !!token && !!menuId,
  });
};
