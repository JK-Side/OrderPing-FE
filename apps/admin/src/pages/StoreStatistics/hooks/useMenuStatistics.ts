import { useQuery } from '@tanstack/react-query';
import { getMenuStatistics } from '@/api/statistics';
import type { StatisticsQueryParams } from '@/api/statistics/entity';
import { useAuth } from '@/utils/hooks/useAuth';

export const useMenuStatistics = (params?: StatisticsQueryParams, enabled: boolean = true) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['statistics-menus', params?.storeId, params?.from, params?.to],
    queryFn: () => getMenuStatistics(params as StatisticsQueryParams),
    enabled: enabled && !!token && !!params?.storeId && !!params?.from && !!params?.to,
  });
};
