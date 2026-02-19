import { getTableMenusByTableId } from '../../../api/customer';
import { useQuery } from '@tanstack/react-query';

export const useStoreOrder = (tableId: number | null) => {
  return useQuery({
    queryKey: ['customer', 'table-menus', tableId],
    queryFn: () => getTableMenusByTableId(tableId as number),
    enabled: (tableId ?? 0) > 0,
  });
};
