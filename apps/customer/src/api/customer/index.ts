import { apiClient } from '..';
import type {
  CreateCustomerOrderRequest,
  CreateCustomerOrderResponse,
  CustomerMenuDetailResponse,
  CustomerOrderLookup,
  CustomerTableMenuResponse,
} from './entity';

export const postCreatedCustomerOrder = async (body: CreateCustomerOrderRequest) => {
  return await apiClient.post<CreateCustomerOrderResponse>('/api/customer/orders', {
    body,
  });
};

export const postCreatedMenu = postCreatedCustomerOrder;

export const getTableMenusByTableId = async (tableId: number) => {
  return await apiClient.get<CustomerTableMenuResponse>(
    `/api/customer/menus/tables/${tableId}`,
  );
};

export const getMenuDetailByMenuId = async (menuId: number) => {
  return await apiClient.get<CustomerMenuDetailResponse>(
    `/api/customer/menus/details/${menuId}`,
  );
};

export const getCustomerOrdersByTableId = async (tableId: number) => {
  return await apiClient.get<CustomerOrderLookup[]>(
    `/api/customer/orders/table/${tableId}`,
  );
};
