export interface CreateMenuRequest {
  storeId: number;
  categoryId: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  stock: number;
}

export interface CreateMenuResponse {
  id: number;
  storeId: number;
  categoryId: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  initialStock: number;
  stock: number;
  soldCount: number;
  isSoldOut: boolean;
}

export interface MenuResponse {
  id: number;
  storeId: number;
  categoryId: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  initialStock: number;
  stock: number;
  soldCount: number;
  isSoldOut: boolean;
}

export type MenuListResponse = MenuResponse[];
