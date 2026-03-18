import { useQuery } from '@tanstack/react-query';
import { getStatistics } from '@/api/statistics';
import type { StatisticsQueryParams } from '@/api/statistics/entity';
import { useAuth } from '@/utils/hooks/useAuth';

export const useStatistics = (params?: StatisticsQueryParams) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['statistics', params?.storeId, params?.from, params?.to],
    queryFn: () => getStatistics(params as StatisticsQueryParams),
    enabled: !!token && !!params?.storeId && !!params?.from && !!params?.to,
  });
};
