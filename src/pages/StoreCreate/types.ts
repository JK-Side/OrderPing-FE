export type StoreCreateForm = {
  storeName: string;
  storeDescription: string;
  storeImage?: FileList;
  bankCode?: string;
  accountHolder?: string;
  accountNumber?: string;
  qrCodeImage?: FileList;
};
