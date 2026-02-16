import { getAvailableMenus } from '@order-ping/shared/api/menu';
import { useAuth } from '@order-ping/shared/utils/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export const useAvailableMenus = (storeId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['menus', storeId, 'available'],
    queryFn: () => getAvailableMenus(storeId as number),
    enabled: !!token && !!storeId,
  });
};
