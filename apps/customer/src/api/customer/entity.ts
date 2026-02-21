type OrderStatus = 'PENDING' | 'COOKING' | 'COMPLETE';

// POST /api/customer/orders
export interface CreateCustomerOrderRequest {
  tableId: number;
  tableNum: number;
  storeId: number;
  depositorName: string;
  couponAmount: number;
  menus: OrderMenu[];
}

interface OrderMenu {
  menuId: number;
  quantity: number;
}

export interface CreateCustomerOrderResponse {
  id: number;
  tableId: number;
  tableNum: number;
  storeId: number;
  depositorName: string;
  status: OrderStatus;
  totalPrice: number;
  couponAmount: number;
  cashAmount: number;
  createdAt: string;
}

export interface CustomerStoreOrderMenu {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  stock: number;
  isSoldOut: boolean;
}

export interface CustomerStoreOrderCategory {
  id: number;
  name: string;
  menus: CustomerStoreOrderMenu[];
}

export interface CustomerTableMenuAccount {
  bankCode: string;
  bankName: string;
  accountHolder: string;
  accountNumberMask: string;
}

// GET /api/customer/menus/tables/{tableId}
export interface CustomerTableMenuResponse {
  storeId: number;
  tableId: number;
  tableNum: number;
  storeName: string;
  storeDescription: string;
  storeImageUrl: string;
  isOpen: boolean;
  categories: CustomerStoreOrderCategory[];
  account: CustomerTableMenuAccount;
}

// GET /api/customer/menus/details/{menuId}
export interface CustomerMenuDetailResponse {
  id: number;
  storeId: number;
  categoryId: number;
  name: string;
  price: number;
  description: string;
  imageUrl: string;
  isSoldOut: boolean;
}
