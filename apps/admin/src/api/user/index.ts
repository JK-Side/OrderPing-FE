import { apiClient } from '..';
import { MyPageResponse } from './entity';

export const getMyPage = async () => {
  return await apiClient.get<MyPageResponse>('/api/users/myPage');
};

export const deleteUserById = async (id: number) => {
  return await apiClient.delete<void>(`/api/users/${id}`);
};
