export type TableStatus = 'OCCUPIED' | 'EMPTY' | 'RESERVED' | 'CLOSED';

export interface CreateTableRequest {
  storeId: number;
  tableNum: number;
}

export interface TableResponse {
  id: number;
  storeId: number;
  tableNum: number;
  status: TableStatus;
  qrToken: string;
  qrUrl: string;
  qrImageUrl: string;
}

export type TableListResponse = TableResponse[];

export interface CreateAllTableRequest {
  storeId: number;
  count: number;
}

export interface UpdateTableQrImagePayload {
  tableId: number;
  qrImage: string;
}

export interface UpdateTableQrImagesRequest {
  updates: UpdateTableQrImagePayload[];
}

interface CreateAllTableResponse {
  id: number;
  storeId: number;
  tableNum: number;
  status: TableStatus;
  qrToken: string;
  qrUrl: string;
  qrImageUrl: string;
}

export type AllTableListResponse = CreateAllTableResponse[];
