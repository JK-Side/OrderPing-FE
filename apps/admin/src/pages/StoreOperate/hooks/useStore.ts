import { useQuery } from '@tanstack/react-query';
import { getStoreById } from '@/api/store';
import { useAuth } from '@/utils/hooks/useAuth';

export const useStoreById = (storeId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['store', storeId],
    queryFn: () => getStoreById(storeId as number),
    enabled: !!token && !!storeId,
  });
};
