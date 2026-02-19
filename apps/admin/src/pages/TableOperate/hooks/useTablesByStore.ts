import { useQuery } from '@tanstack/react-query';
import { getTablesByStore } from '@/api/table';
import type { TableStatus } from '@/api/table/entity';
import { useAuth } from '@/utils/hooks/useAuth';

export const useTablesByStore = (storeId?: number, status?: TableStatus) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['tables', storeId, status ?? 'all'],
    queryFn: () => getTablesByStore(storeId as number, status),
    enabled: !!token && !!storeId,
  });
};
