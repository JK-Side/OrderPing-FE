export type OrderLookupStatus = 'PENDING' | 'COOKING' | 'SERVED';

export type OrderLookupResponse = {
  id: number;
  tableId: number;
  storeId: number;
  depositorName: string;
  status: OrderLookupStatus;
  totalPrice: number;
  couponAmount: number;
  cashAmount: number;
  createdAt: string;
};

export const orderLookupMock: OrderLookupResponse[] = [
  {
    id: 1,
    tableId: 1,
    storeId: 1,
    depositorName: '박순자',
    status: 'PENDING',
    totalPrice: 216900,
    couponAmount: 10000,
    cashAmount: 206900,
    createdAt: '2026-01-22T08:40:12.120000',
  },
  {
    id: 2,
    tableId: 3,
    storeId: 1,
    depositorName: '허준기',
    status: 'PENDING',
    totalPrice: 44900,
    couponAmount: 10000,
    cashAmount: 34900,
    createdAt: '2026-01-22T08:44:50.450000',
  },
  {
    id: 3,
    tableId: 14,
    storeId: 1,
    depositorName: '정예원',
    status: 'PENDING',
    totalPrice: 24900,
    couponAmount: 0,
    cashAmount: 24900,
    createdAt: '2026-01-22T08:47:20.020000',
  },
  {
    id: 4,
    tableId: 9,
    storeId: 1,
    depositorName: '황현서',
    status: 'PENDING',
    totalPrice: 400000,
    couponAmount: 400000,
    cashAmount: 0,
    createdAt: '2026-01-22T08:49:05.303798',
  },
  {
    id: 5,
    tableId: 8,
    storeId: 1,
    depositorName: '조정원',
    status: 'COOKING',
    totalPrice: 26900,
    couponAmount: 0,
    cashAmount: 26900,
    createdAt: '2026-01-22T09:05:10.110000',
  },
  {
    id: 6,
    tableId: 2,
    storeId: 1,
    depositorName: '황현식',
    status: 'COOKING',
    totalPrice: 24000,
    couponAmount: 20000,
    cashAmount: 4000,
    createdAt: '2026-01-22T09:07:40.400000',
  },
  {
    id: 7,
    tableId: 12,
    storeId: 1,
    depositorName: '라문우',
    status: 'COOKING',
    totalPrice: 819900,
    couponAmount: 800000,
    cashAmount: 19900,
    createdAt: '2026-01-22T09:12:35.350000',
  },
  {
    id: 8,
    tableId: 7,
    storeId: 1,
    depositorName: '소중대정민서',
    status: 'SERVED',
    totalPrice: 75900,
    couponAmount: 0,
    cashAmount: 75900,
    createdAt: '2026-01-22T10:02:10.100000',
  },
  {
    id: 9,
    tableId: 3,
    storeId: 1,
    depositorName: '당근김소민',
    status: 'SERVED',
    totalPrice: 24000,
    couponAmount: 0,
    cashAmount: 24000,
    createdAt: '2026-01-22T10:05:42.420000',
  },
  {
    id: 10,
    tableId: 5,
    storeId: 1,
    depositorName: '갑자기백수된이동우',
    status: 'SERVED',
    totalPrice: 28900,
    couponAmount: 10000,
    cashAmount: 18900,
    createdAt: '2026-01-22T10:08:55.550000',
  },
  {
    id: 11,
    tableId: 17,
    storeId: 1,
    depositorName: '정민구독립투사',
    status: 'SERVED',
    totalPrice: 34000,
    couponAmount: 0,
    cashAmount: 34000,
    createdAt: '2026-01-22T10:12:14.140000',
  },
];
