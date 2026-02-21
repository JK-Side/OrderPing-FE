/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export interface CartItem {
  menuId: number;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
}

interface AddMenuInput {
  menuId: number;
  name: string;
  price: number;
  imageUrl: string;
}

interface CartContextValue {
  items: CartItem[];
  totalQuantity: number;
  totalPrice: number;
  addMenu: (menu: AddMenuInput, quantity: number) => void;
  removeMenu: (menuId: number) => void;
  setMenuQuantity: (menuId: number, quantity: number) => void;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  const addMenu = (menu: AddMenuInput, quantity: number) => {
    setItems((prev) => {
      const existing = prev.find((item) => item.menuId === menu.menuId);
      if (!existing) {
        return [
          ...prev,
          {
            ...menu,
            quantity,
          },
        ];
      }

      return prev.map((item) =>
        item.menuId === menu.menuId
          ? { ...item, quantity: Math.min(item.quantity + quantity, 99) }
          : item,
      );
    });
  };

  const removeMenu = (menuId: number) => {
    setItems((prev) => prev.filter((item) => item.menuId !== menuId));
  };

  const setMenuQuantity = (menuId: number, quantity: number) => {
    setItems((prev) =>
      prev
        .map((item) => (item.menuId === menuId ? { ...item, quantity } : item))
        .filter((item) => item.quantity > 0),
    );
  };

  const clearCart = () => {
    setItems([]);
  };

  const totalQuantity = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );
  const totalPrice = useMemo(
    () => items.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      totalQuantity,
      totalPrice,
      addMenu,
      removeMenu,
      setMenuQuantity,
      clearCart,
    }),
    [items, totalQuantity, totalPrice],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider.');
  }
  return context;
}
