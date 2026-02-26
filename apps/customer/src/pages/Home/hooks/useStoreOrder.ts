import { getTableMenusByTableId } from '../../../api/customer';
import { useQuery } from '@tanstack/react-query';

export const useStoreOrder = (storeId: number | null, tableNum: number | null) => {
  return useQuery({
    queryKey: ['customer', 'table-menus', storeId, tableNum],
    queryFn: () => getTableMenusByTableId(storeId as number, tableNum as number),
    enabled: (storeId ?? 0) > 0 && (tableNum ?? 0) > 0,
  });
};
