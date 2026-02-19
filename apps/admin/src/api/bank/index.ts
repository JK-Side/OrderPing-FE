import { apiClient } from '..';
import { BankCodeResponse } from './entity';

export const getBanks = async () => {
  return await apiClient.get<BankCodeResponse[]>('/api/banks', {
  });
};
