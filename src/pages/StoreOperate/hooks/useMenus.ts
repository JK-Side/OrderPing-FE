import { useQuery } from '@tanstack/react-query';
import { getMenusByCategory } from '@/api/menu';
import { useAuth } from '@/utils/hooks/useAuth';

export const useMenusByCategory = (storeId?: number, categoryId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['menus', storeId, categoryId],
    queryFn: () => getMenusByCategory(storeId as number, categoryId as number),
    enabled: !!token && !!storeId && !!categoryId,
  });
};
