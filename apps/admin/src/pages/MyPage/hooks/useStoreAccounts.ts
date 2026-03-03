import { useQuery } from '@tanstack/react-query';
import { getStoreAccounts } from '@/api/storeAccount';
import { useAuth } from '@/utils/hooks/useAuth';

export const useStoreAccounts = (storeId: number, enabled: boolean) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['storeAccounts', storeId],
    queryFn: () => getStoreAccounts(storeId),
    enabled: !!token && !!storeId && enabled,
  });
};
