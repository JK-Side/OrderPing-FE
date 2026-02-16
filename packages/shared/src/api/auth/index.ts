import { apiClient } from '..';
import { UserInfoResponse, RefreshResponse } from './entity';

export const postLogout = async () => {
  return await apiClient.post<void>('/api/auth/logout');
};

export const getUserInfo = async () => {
  return await apiClient.get<UserInfoResponse>('/api/main');
};

export const postRefresh = () => {
  return apiClient.post<RefreshResponse>('/api/auth/refresh', {
    skipAuth: true,
    skipRefresh: true,
  });
};
