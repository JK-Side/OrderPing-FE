/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

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
  setActiveTable: (tableId: number | null) => void;
  addMenu: (menu: AddMenuInput, quantity: number) => void;
  removeMenu: (menuId: number) => void;
  setMenuQuantity: (menuId: number, quantity: number) => void;
  clearCart: () => void;
}

interface TableCartEntry {
  items: CartItem[];
  updatedAt: number;
}

interface PersistedCartState {
  version: 1;
  tableCarts: Record<string, TableCartEntry>;
}

const STORAGE_KEY = 'order-ping:customer-cart:v1';
const DEFAULT_TABLE_KEY = 'default';
const CART_TTL_MS = 3 * 60 * 60 * 1000;
const EMPTY_ITEMS: CartItem[] = [];

const CartContext = createContext<CartContextValue | null>(null);

const getTableKey = (tableId: number | null | undefined) => {
  if (typeof tableId !== 'number' || !Number.isInteger(tableId) || tableId <= 0) {
    return DEFAULT_TABLE_KEY;
  }

  return `table:${tableId}`;
};

const isValidCartItem = (value: unknown): value is CartItem => {
  if (!value || typeof value !== 'object') return false;

  const item = value as CartItem;
  return (
    typeof item.menuId === 'number' &&
    Number.isInteger(item.menuId) &&
    item.menuId > 0 &&
    typeof item.name === 'string' &&
    typeof item.price === 'number' &&
    Number.isFinite(item.price) &&
    typeof item.imageUrl === 'string' &&
    typeof item.quantity === 'number' &&
    Number.isInteger(item.quantity) &&
    item.quantity > 0
  );
};

const loadPersistedTableCarts = (): Record<string, TableCartEntry> => {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }

    const parsed = JSON.parse(raw) as PersistedCartState;
    if (!parsed || parsed.version !== 1 || typeof parsed.tableCarts !== 'object') {
      return {};
    }

    const now = Date.now();
    const next: Record<string, TableCartEntry> = {};

    Object.entries(parsed.tableCarts).forEach(([tableKey, entry]) => {
      if (!entry || typeof entry !== 'object') return;
      if (typeof entry.updatedAt !== 'number') return;
      if (!Array.isArray(entry.items)) return;
      if (now - entry.updatedAt > CART_TTL_MS) return;

      const validItems = entry.items
        .filter(isValidCartItem)
        .map((item) => ({ ...item, quantity: Math.min(item.quantity, 99) }));

      if (validItems.length === 0) return;

      next[tableKey] = {
        items: validItems,
        updatedAt: entry.updatedAt,
      };
    });

    return next;
  } catch {
    return {};
  }
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [tableCarts, setTableCarts] = useState<Record<string, TableCartEntry>>(() =>
    loadPersistedTableCarts(),
  );
  const [activeTableKey, setActiveTableKey] = useState(DEFAULT_TABLE_KEY);

  const items = tableCarts[activeTableKey]?.items ?? EMPTY_ITEMS;

  const setActiveTable = useCallback((tableId: number | null) => {
    setActiveTableKey(getTableKey(tableId));
  }, []);

  const updateActiveTable = useCallback(
    (updater: (prevItems: CartItem[]) => CartItem[]) => {
      setTableCarts((prev) => {
        const prevItems = prev[activeTableKey]?.items ?? [];
        const nextItems = updater(prevItems).filter((item) => item.quantity > 0);

        if (nextItems.length === 0) {
          if (!(activeTableKey in prev)) {
            return prev;
          }

          const next = { ...prev };
          delete next[activeTableKey];
          return next;
        }

        return {
          ...prev,
          [activeTableKey]: {
            items: nextItems,
            updatedAt: Date.now(),
          },
        };
      });
    },
    [activeTableKey],
  );

  const addMenu = useCallback(
    (menu: AddMenuInput, quantity: number) => {
      const safeQuantity = Math.min(Math.max(quantity, 1), 99);

      updateActiveTable((prevItems) => {
        const existing = prevItems.find((item) => item.menuId === menu.menuId);
        if (!existing) {
          return [
            ...prevItems,
            {
              ...menu,
              quantity: safeQuantity,
            },
          ];
        }

        return prevItems.map((item) =>
          item.menuId === menu.menuId
            ? { ...item, quantity: Math.min(item.quantity + safeQuantity, 99) }
            : item,
        );
      });
    },
    [updateActiveTable],
  );

  const removeMenu = useCallback(
    (menuId: number) => {
      updateActiveTable((prevItems) => prevItems.filter((item) => item.menuId !== menuId));
    },
    [updateActiveTable],
  );

  const setMenuQuantity = useCallback(
    (menuId: number, quantity: number) => {
      const safeQuantity = Math.min(Math.max(quantity, 0), 99);

      updateActiveTable((prevItems) =>
        prevItems
          .map((item) => (item.menuId === menuId ? { ...item, quantity: safeQuantity } : item))
          .filter((item) => item.quantity > 0),
      );
    },
    [updateActiveTable],
  );

  const clearCart = useCallback(() => {
    setTableCarts((prev) => {
      if (!(activeTableKey in prev)) {
        return prev;
      }

      const next = { ...prev };
      delete next[activeTableKey];
      return next;
    });
  }, [activeTableKey]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const payload: PersistedCartState = {
      version: 1,
      tableCarts,
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [tableCarts]);

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
      setActiveTable,
      addMenu,
      removeMenu,
      setMenuQuantity,
      clearCart,
    }),
    [items, totalQuantity, totalPrice, setActiveTable, addMenu, removeMenu, setMenuQuantity, clearCart],
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
