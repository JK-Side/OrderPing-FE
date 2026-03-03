export interface MyPageAccount {
  bankCode: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

export interface MyPageStore {
  storeId: number;
  name: string;
  description: string;
  account: MyPageAccount | null;
}

export interface MyPageResponse {
  stores: MyPageStore[];
}
