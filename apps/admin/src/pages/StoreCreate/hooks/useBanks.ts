import { useQuery } from '@tanstack/react-query';
import { getBanks } from '@/api/bank';

export const useBanks = (enabled = true) => {
  return useQuery({
    queryKey: ['banks'],
    queryFn: getBanks,
    enabled,
  });
};
