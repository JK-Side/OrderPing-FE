import { getStoreById } from '@order-ping/shared/api/store';
import { useAuth } from '@order-ping/shared/utils/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export const useStoreById = (storeId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['store', storeId],
    queryFn: () => getStoreById(storeId as number),
    enabled: !!token && !!storeId,
  });
};
