import { apiClient } from '..';
import { LogoutRequest, UserInfoResponse, RefreshResponse } from './entity';

export const postLogout = async (refreshToken: string) => {
  return await apiClient.post<LogoutRequest>('/api/auth/logout', {
    body: { refreshToken },
  });
};

export const getUserInfo = async () => {
  return await apiClient.get<UserInfoResponse>('/api/main');
};

export const postRefresh = (refreshToken: string) => {
  return apiClient.post<RefreshResponse>('/api/auth/refresh', {
    skipAuth: true,
    skipRefresh: true,
    body: { refreshToken },
  });
};
