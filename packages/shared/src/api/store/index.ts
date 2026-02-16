import { apiClient } from '..';
import {
  PresignedUrlRequest,
  PresignedUrlResponse,
  CreatedStoreRequest,
  CreatedStoreResponse,
  StoreDetailResponse,
  UpdateStoreRequest,
} from './entity';

export const postPresignedUrl = async (body: PresignedUrlRequest) => {
  return await apiClient.post<PresignedUrlResponse>('/api/images/presigned-url', {
    body,
  });
};

export const postCreatedStore = async (body: CreatedStoreRequest) => {
  return await apiClient.post<CreatedStoreResponse>('/api/stores', {
    body,
  });
};

export const getStoreById = async (id: number) => {
  return await apiClient.get<StoreDetailResponse>(`/api/stores/${id}`);
};

export const putStoreById = async (id: number, body: UpdateStoreRequest) => {
  return await apiClient.put<StoreDetailResponse>(`/api/stores/${id}`, {
    body,
  });
};
