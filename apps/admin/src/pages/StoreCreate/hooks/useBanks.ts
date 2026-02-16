import { getBanks } from '@order-ping/shared/api/bank';
import { useQuery } from '@tanstack/react-query';

export const useBanks = () => {
  return useQuery({
    queryKey: ['banks'],
    queryFn: getBanks,
  });
};
