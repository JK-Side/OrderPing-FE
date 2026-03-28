import { apiClient } from '..';
import { MyPageResponse } from './entity';

export const getMyPage = async () => {
  return await apiClient.get<MyPageResponse>('/api/users/myPage');
};

export const deleteUser = async () => {
  return await apiClient.delete<void>('/api/users');
};
