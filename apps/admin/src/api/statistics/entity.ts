export interface StatisticsQueryParams {
  storeId: number;
  from: string;
  to: string;
}

export interface StatisticsOrderMenu {
  menuName: string;
  quantity: number;
  price: number;
  isService: boolean;
}

export interface StatisticsOrder {
  orderNumber: number;
  tableNum: number;
  orderedAt: string;
  menus: StatisticsOrderMenu[];
  totalPrice: number;
  depositorName: string;
}

export interface StatisticsResponse {
  totalRevenue: number;
  transferRevenue: number;
  couponRevenue: number;
  tableFeeQuantity: number;
  tableFeeRevenue: number;
  orderCount: number;
  orders: StatisticsOrder[];
}

export interface MenuStatisticsItem {
  menuId: number;
  menuName: string;
  initialStock: number;
  soldQuantity: number;
}

export interface MenuStatisticsResponse {
  menus: MenuStatisticsItem[];
}
