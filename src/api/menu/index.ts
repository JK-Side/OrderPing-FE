import { apiClient } from '..';
import { CreateMenuRequest, CreateMenuResponse } from './entity';

export const postCreatedMenu = async (body: CreateMenuRequest) => {
  return await apiClient.post<CreateMenuResponse>('/api/menus', {
    body,
  });
};
