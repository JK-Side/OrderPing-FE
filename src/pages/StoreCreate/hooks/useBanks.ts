import { useQuery } from '@tanstack/react-query';
import { getBanks } from '@/api/bank';

export const useBanks = () => {
  return useQuery({
    queryKey: ['banks'],
    queryFn: getBanks,
  });
};
