import { apiClient } from '..';
import { PresignedUrlRequest, PresignedUrlResponse, CreatedStoreRequest, CreatedStoreResponse } from './entity';

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
