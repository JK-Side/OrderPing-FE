import { useQuery } from '@tanstack/react-query';
import { getOrderById } from '@/api/order';
import { useAuth } from '@/utils/hooks/useAuth';

export const useOrderById = (orderId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => getOrderById(orderId as number),
    enabled: !!token && !!orderId,
  });
};
