'use client';

/**
 * CartContext — shared cart state for the whole app.
 * Uses localStorage so the cart survives page navigations.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';

export interface CartItem {
  artId: string;
  name: string;
  plateRef: string;
  substrate: string;
  dimensions: string;
  colorProfile: string;
  unitPrice: number;
  quantity: number;
  minQty: number;
  previewUrl: string;
}

interface CartContextValue {
  items: CartItem[];
  count: number;
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (artId: string) => void;
  updateQty: (artId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (artId: string) => boolean;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = 'gss-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      // ignore parse errors
    }
  }, []);

  // Persist to localStorage whenever items change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const addItem = useCallback((newItem: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.artId === newItem.artId);
      if (existing) {
        // bump quantity
        return prev.map((i) =>
          i.artId === newItem.artId
            ? { ...i, quantity: i.quantity + (newItem.quantity ?? newItem.minQty) }
            : i
        );
      }
      return [
        ...prev,
        { ...newItem, quantity: newItem.quantity ?? newItem.minQty },
      ];
    });
  }, []);

  const removeItem = useCallback((artId: string) => {
    setItems((prev) => prev.filter((i) => i.artId !== artId));
  }, []);

  const updateQty = useCallback((artId: string, quantity: number) => {
    setItems((prev) =>
      prev.map((i) =>
        i.artId === artId ? { ...i, quantity: Math.max(i.minQty, quantity) } : i
      )
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const isInCart = useCallback(
    (artId: string) => items.some((i) => i.artId === artId),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        count: items.length,
        addItem,
        removeItem,
        updateQty,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
