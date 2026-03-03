import { useQuery } from '@tanstack/react-query';
import { getTableQrList } from '@/api/table';
import { useAuth } from '@/utils/hooks/useAuth';

export const useTableQrList = (storeId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['tables', 'qr', storeId],
    queryFn: () => getTableQrList(storeId as number),
    enabled: !!token && !!storeId,
  });
};
