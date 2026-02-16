import { getOrderById } from '@order-ping/shared/api/order';
import { useAuth } from '@order-ping/shared/utils/hooks/useAuth';
import { useQuery } from '@tanstack/react-query';

export const useOrderById = (orderId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => getOrderById(orderId as number),
    enabled: !!token && !!orderId,
  });
};
