import { useQuery } from '@tanstack/react-query';
import { getAvailableMenus } from '@/api/menu';
import { useAuth } from '@/utils/hooks/useAuth';

export const useAvailableMenus = (storeId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['menus', storeId, 'available'],
    queryFn: () => getAvailableMenus(storeId as number),
    enabled: !!token && !!storeId,
  });
};
