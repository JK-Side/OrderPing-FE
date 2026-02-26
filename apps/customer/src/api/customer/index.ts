import { apiClient } from '..';
import type {
  CustomerPaymentDeeplinkResponse,
  CreateCustomerOrderRequest,
  CreateCustomerOrderResponse,
  CustomerMenuDetailResponse,
  CustomerOrderLookupResponse,
  CustomerTableMenuResponse,
} from './entity';

export const postCreatedCustomerOrder = async (body: CreateCustomerOrderRequest) => {
  return await apiClient.post<CreateCustomerOrderResponse>('/api/customer/orders', {
    body,
  });
};

export const postCreatedMenu = postCreatedCustomerOrder;

export const getTableMenusByTableId = async (storeId: number, tableNum: number) => {
  return await apiClient.get<CustomerTableMenuResponse>(
    `/api/customer/stores/${storeId}?tableNum=${tableNum}`,
  );
};

export const getMenuDetailByMenuId = async (menuId: number) => {
  return await apiClient.get<CustomerMenuDetailResponse>(
    `/api/customer/stores/details/${menuId}`,
  );
};

export const getCustomerOrdersByTableId = async (storeId: number, tableNum: number) => {
  return await apiClient.get<CustomerOrderLookupResponse[]>(
    '/api/customer/orders/table',
    {
      params: { storeId, tableNum },
    },
  );
};

export const getPaymentTossDeeplink = async (params: {
  storeId: number;
  amount: number;
}) => {
  return await apiClient.get<CustomerPaymentDeeplinkResponse>('/api/payments/deeplink', {
    params,
  });
};
