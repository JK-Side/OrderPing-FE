import { apiClient } from '..';
import type { AllTableListResponse, CreateAllTableRequest, CreateTableRequest, TableListResponse, TableResponse, TableStatus } from './entity';

// GET  /api/tables  매장별 테이블 목록
export const getTablesByStore = async (storeId: number, status?: TableStatus) => {
  return await apiClient.get<TableListResponse>('/api/tables', {
    params: status ? { storeId, status } : { storeId },
  });
};

// POST  /api/tables 테이블 생성
export const postCreatedTable = async (body: CreateTableRequest) => {
  return await apiClient.post<TableResponse>('/api/tables', {
    body,
  });
};


// POST  /api/tables/bulk 테이블 일괄 생성
export const postCreatedAllTable = async (body: CreateAllTableRequest) => {
  return await apiClient.post<AllTableListResponse>('/api/tables/bulk', {
    body,
  });
};
