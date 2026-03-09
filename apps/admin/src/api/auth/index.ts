import { apiClient } from '..';
import { UserInfoResponse, RefreshResponse } from './entity';

interface AuthRequestOptions {
  skipAuth?: boolean;
  skipRefresh?: boolean;
}

export const postLogout = async (options: AuthRequestOptions = {}) => {
  return await apiClient.post<void>('/api/auth/logout', options);
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
