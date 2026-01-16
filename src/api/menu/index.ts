import { apiClient } from '..';
import { CreateMenuRequest, CreateMenuResponse, MenuListResponse } from './entity';

export const postCreatedMenu = async (body: CreateMenuRequest) => {
  return await apiClient.post<CreateMenuResponse>('/api/menus', {
    body,
  });
};

export const getMenusByCategory = async (storeId: number, categoryId: number) => {
  try {
    return await apiClient.get<MenuListResponse>('/api/menus', {
      params: { storeId, categoryId },
    });
  } catch (error) {
    const status = (error as { status?: number })?.status;
    if (status === 404) {
      return [];
    }
    throw error;
  }
};
