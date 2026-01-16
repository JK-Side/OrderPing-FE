export interface PresignedUrlRequest {
  directory: string,
  fileName: string,
}

export interface PresignedUrlResponse {
  presignedUrl: string,
  imageUrl: string,
  key: string,
  maxFileSize: number,
}

export interface CreatedStoreRequest {
  name: string;
  description: string;
  imageUrl: string;
  bankCode: string;
  accountHolder: string;
  accountNumber: string;
}

export interface CreatedStoreResponse {
  id: number;
  userId: number;
  name: string;
  description: string;
  isOpen: boolean;
  imageUrl: string;
  createdAt: string;
}

export interface StoreDetailResponse {
  id: number;
  userId: number;
  name: string;
  description: string;
  isOpen: boolean;
  imageUrl: string;
  createdAt: string;
}
