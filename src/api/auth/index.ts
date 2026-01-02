import { getAuthHeader } from '@/utils/ts/auth';
import { apiClient } from '..';
import { LogoutRequest, InfoResponse } from './entity';

export const postLogout = async (refreshToken: string) => {
  return await apiClient.post<LogoutRequest>('/api/auth/logout', {
    body: { refreshToken },
  });
};

export const getUserInfo = async () => {
  return await apiClient.get<InfoResponse>('/api/main', {
    headers: getAuthHeader(),
  });
};
