export interface MenuCreateForm {
  name: string;
  price: string;
  stock: string;
  categoryId: number;
  description?: string;
  menuImage?: FileList;
}
