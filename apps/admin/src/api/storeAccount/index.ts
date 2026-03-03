import { apiClient } from '..';
import { StoreAccountListItem, StoreAccountResponse, UpdateStoreAccountRequest } from './entity';

export const getStoreAccounts = async (storeId: number) => {
  return await apiClient.get<StoreAccountListItem[]>('/api/store-accounts', {
    params: {
      storeId,
    },
  });
};

export const putStoreAccountById = async (id: number, body: UpdateStoreAccountRequest) => {
  return await apiClient.put<StoreAccountResponse>(`/api/store-accounts/${id}`, {
    body,
  });
};
