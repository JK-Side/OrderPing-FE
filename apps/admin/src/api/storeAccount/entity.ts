export interface UpdateStoreAccountRequest {
  bankCode: string;
  accountHolder: string;
  accountNumber: string;
}

export interface StoreAccountResponse {
  id?: number;
  bankCode: string;
  bankName?: string;
  accountHolder: string;
  accountNumber: string;
}
