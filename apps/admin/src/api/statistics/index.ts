import { apiClient } from '..';
import type { MenuStatisticsResponse, StatisticsQueryParams, StatisticsResponse } from './entity';

export const getStatistics = async (params: StatisticsQueryParams) => {
  return await apiClient.get<StatisticsResponse>('/api/statistics', {
    params: {
      storeId: params.storeId,
      from: params.from,
      to: params.to,
    },
  });
};

export const getMenuStatistics = async (params: StatisticsQueryParams) => {
  return await apiClient.get<MenuStatisticsResponse>('/api/statistics/menus', {
    params: {
      storeId: params.storeId,
      from: params.from,
      to: params.to,
    },
  });
};
