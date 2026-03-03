import { apiClient } from '..';
import { StoreAccountResponse, UpdateStoreAccountRequest } from './entity';

export const putStoreAccountById = async (id: number, body: UpdateStoreAccountRequest) => {
  return await apiClient.put<StoreAccountResponse>(`/api/store-accounts/${id}`, {
    body,
  });
};
