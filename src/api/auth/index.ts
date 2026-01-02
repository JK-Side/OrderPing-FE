import { apiClient } from '..';
import { LogoutRequest, UserInfoResponse } from './entity';

export const postLogout = async (refreshToken: string) => {
  return await apiClient.post<LogoutRequest>('/api/auth/logout', {
    body: { refreshToken },
  });
};

export const getUserInfo = async () => {
  return await apiClient.get<UserInfoResponse>('/api/main');
};
