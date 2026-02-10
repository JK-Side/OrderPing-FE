import { useQuery } from '@tanstack/react-query';
import { getOrdersByStore } from '@/api/order';
import type { OrderLookupResponse } from '@/api/order/entity';
import { useAuth } from '@/utils/hooks/useAuth';

export const useOrdersByStore = (storeId?: number) => {
  const { token } = useAuth();

  return useQuery({
    queryKey: ['orders', storeId],
    queryFn: async () => {
      const data = await getOrdersByStore(storeId as number);
      return data.map<OrderLookupResponse>((order) => ({
        id: order.id,
        tableId: order.tableId,
        tableNum: order.tableNum,
        storeId: order.storeId,
        depositorName: order.depositorName,
        status: order.status,
        totalPrice: order.totalPrice,
        couponAmount: order.couponAmount,
        cashAmount: order.cashAmount,
        createdAt: order.createdAt,
      }));
    },
    enabled: !!token && !!storeId,
  });
};
