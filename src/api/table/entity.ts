export type TableStatus = 'OCCUPIED' | 'EMPTY' | 'RESERVED' | 'CLOSED';
export type TableOrderStatus = 'PENDING' | 'COOKING' | 'COMPLETE';

export interface TableOrderMenu {
  menuId: number;
  menuName: string;
  quantity: number;
  price: number;
}

export interface CreateTableRequest {
  storeId: number;
  tableNum: number;
}

export interface TableResponse {
  id: number;
  storeId: number;
  tableNum: number;
  status: TableStatus;
  qrImageUrl: string;
  orderMenus?: TableOrderMenu[];
  serviceMenus: TableOrderMenu[];
  totalOrderAmount?: number;
  orderStatus?: TableOrderStatus | null;
}

export type TableListResponse = TableResponse[];

export interface CreateAllTableRequest {
  storeId: number;
  count: number;
}

export interface UpdateTableQrImagePayload {
  tableId: number;
  qrImageUrl: string;
}

export interface UpdateTableQrImagesRequest {
  updates: UpdateTableQrImagePayload[];
}

export interface UpdateTableQrImageRequest {
  qrImageUrl: string;
}

interface CreateAllTableResponse {
  id: number;
  storeId: number;
  tableNum: number;
  status: TableStatus;
  qrToken: string;
  qrUrl: string | null;
  qrImageUrl: string;
}

export type AllTableListResponse = CreateAllTableResponse[];
