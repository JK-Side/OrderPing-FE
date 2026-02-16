import { getMenusByCategory } from '@order-ping/shared/api/menu';
import { useAuth } from '@order-ping/shared/utils/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export const useMenusByCategory = (storeId?: number, categoryId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['menus', storeId, categoryId],
    queryFn: () => getMenusByCategory(storeId as number, categoryId as number),
    enabled: !!token && !!storeId && !!categoryId,
  });
};
