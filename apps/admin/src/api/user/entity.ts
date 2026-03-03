export interface MyPageAccount {
  id?: number;
  accountId?: number;
  bankCode: string;
  bankName: string;
  accountHolder: string;
  accountNumber: string;
}

export interface MyPageStore {
  storeId: number;
  name: string;
  description: string;
  imageUrl?: string;
  account: MyPageAccount | null;
}

export interface MyPageResponse {
  stores: MyPageStore[];
}
