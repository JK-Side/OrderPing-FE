import { getTablesByStore } from '@order-ping/shared/api/table';
import { useAuth } from '@order-ping/shared/utils/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import type { TableStatus } from '@order-ping/shared/api/table/entity';

export const useTablesByStore = (storeId?: number, status?: TableStatus) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['tables', storeId, status ?? 'all'],
    queryFn: () => getTablesByStore(storeId as number, status),
    enabled: !!token && !!storeId,
  });
};
