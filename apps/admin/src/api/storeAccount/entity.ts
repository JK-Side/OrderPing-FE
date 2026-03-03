export interface UpdateStoreAccountRequest {
  bankCode: string;
  accountHolder: string;
  accountNumber: string;
}

export interface StoreAccountListItem {
  id: number;
  storeId: number;
  bankCode: string;
  accountHolder: string;
  accountNumberMask: string;
  isActive: boolean;
}

export interface StoreAccountResponse {
  id?: number;
  bankCode: string;
  bankName?: string;
  accountHolder: string;
  accountNumber: string;
}
