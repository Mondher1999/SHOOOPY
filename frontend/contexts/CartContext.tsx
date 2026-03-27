"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCartAPI,
  addItemAPI,
  updateQuantityAPI,
  removeItemAPI,
  clearCartAPI,
  mergeCartAPI,
  type GuestCartItem,
} from "@/services/cart-service";
import logger from "@/lib/logger";
import type { Cart, CartItem } from "@/types";

// ─── Guest cart (localStorage) ───────────────────────────────────────────────

const GUEST_CART_KEY = "shopflow_guest_cart";

interface GuestItem {
  productId: string;
  quantity: number;
  selectedOptions?: Record<string, string>;
}

// Composite key for guest cart identity: productId + sorted options
function guestItemKey(productId: string, opts?: Record<string, string>): string {
  if (!opts || Object.keys(opts).length === 0) return productId;
  const sorted = Object.keys(opts).sort().reduce<Record<string, string>>((acc, k) => {
    acc[k] = opts[k];
    return acc;
  }, {});
  return `${productId}::${JSON.stringify(sorted)}`;
}

function loadGuestCart(): GuestItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? (JSON.parse(raw) as GuestItem[]) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items: GuestItem[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch {
    // ignore write errors
  }
}

function clearGuestCart(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(GUEST_CART_KEY);
}

// ─── Context shape ────────────────────────────────────────────────────────────

interface CartContextValue {
  cart: Cart | null;
  guestItems: GuestItem[];
  isLoading: boolean;
  error: string | null;
  totalItems: number;
  totalPrice: number;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  addItem: (productId: string, quantity?: number, selectedOptions?: Record<string, string>) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, selectedOptions?: Record<string, string>) => Promise<void>;
  removeItem: (productId: string, selectedOptions?: Record<string, string>) => Promise<void>;
  clearCart: () => Promise<void>;
  reload: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [cart, setCart] = useState<Cart | null>(null);
  const [guestItems, setGuestItems] = useState<GuestItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Track previous user to detect login/logout
  const prevUserRef = useRef<string | null>(null);

  // ─── Load server cart ───────────────────────────────────────────────────
  const fetchServerCart = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getCartAPI();
      setCart(res.data);
    } catch (err) {
      logger.error("fetchServerCart error:", err);
      setError("cart.errorLoading");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── On mount: hydrate guest cart from localStorage ──────────────────────
  useEffect(() => {
    setGuestItems(loadGuestCart());
  }, []);

  // ─── React to auth state changes ─────────────────────────────────────────
  useEffect(() => {
    const currentUserId = user?.id ?? null;
    const prevUserId = prevUserRef.current;

    if (currentUserId && currentUserId !== prevUserId) {
      // User just logged in → merge guest cart then fetch
      const guest = loadGuestCart();
      if (guest.length > 0) {
        mergeCartAPI(guest as GuestCartItem[])
          .then((res) => {
            setCart(res.data);
            setGuestItems([]);
            clearGuestCart();
          })
          .catch((err) => {
            logger.error("mergeCart error:", err);
            // Fall back to just fetching existing server cart
            fetchServerCart();
          });
      } else {
        fetchServerCart();
      }
    } else if (!currentUserId && prevUserId) {
      // User logged out → clear server cart from state
      setCart(null);
    } else if (currentUserId) {
      // Already logged in on mount
      fetchServerCart();
    }

    prevUserRef.current = currentUserId;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ─── Computed values (memoized) ──────────────────────────────────────────
  const totalItems = useMemo(
    () => user
      ? (cart?.items ?? []).reduce((sum, i) => sum + i.quantity, 0)
      : guestItems.reduce((sum, i) => sum + i.quantity, 0),
    [user, cart?.items, guestItems]
  );

  const totalPrice = useMemo(() => cart?.totalPrice ?? 0, [cart?.totalPrice]);

  // ─── Drawer ───────────────────────────────────────────────────────────────
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // ─── Actions (authenticated) ──────────────────────────────────────────────
  const addItem = useCallback(
    async (productId: string, quantity = 1, selectedOptions?: Record<string, string>) => {
      if (!user) {
        // Guest: update localStorage with composite identity
        setGuestItems((prev) => {
          const key = guestItemKey(productId, selectedOptions);
          const existing = prev.find((i) => guestItemKey(i.productId, i.selectedOptions) === key);
          const next = existing
            ? prev.map((i) =>
                guestItemKey(i.productId, i.selectedOptions) === key
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              )
            : [...prev, { productId, quantity, selectedOptions }];
          saveGuestCart(next);
          return next;
        });
        return;
      }

      try {
        const res = await addItemAPI(productId, quantity, selectedOptions);
        setCart(res.data);
      } catch (err) {
        logger.error("addItem error:", err);
        throw err; // let caller show toast
      }
    },
    [user]
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number, selectedOptions?: Record<string, string>) => {
      if (!user) return; // guests don't have full product info to validate stock
      try {
        const res = await updateQuantityAPI(productId, quantity, selectedOptions);
        setCart(res.data);
      } catch (err) {
        logger.error("updateQuantity error:", err);
        throw err;
      }
    },
    [user]
  );

  const removeItem = useCallback(
    async (productId: string, selectedOptions?: Record<string, string>) => {
      if (!user) {
        setGuestItems((prev) => {
          const key = guestItemKey(productId, selectedOptions);
          const next = prev.filter((i) => guestItemKey(i.productId, i.selectedOptions) !== key);
          saveGuestCart(next);
          return next;
        });
        return;
      }
      try {
        const res = await removeItemAPI(productId, selectedOptions);
        setCart(res.data);
      } catch (err) {
        logger.error("removeItem error:", err);
        throw err;
      }
    },
    [user]
  );

  const clearCart = useCallback(async () => {
    if (!user) {
      setGuestItems([]);
      clearGuestCart();
      return;
    }
    try {
      await clearCartAPI();
      setCart((prev) => (prev ? { ...prev, items: [], totalPrice: 0 } : null));
    } catch (err) {
      logger.error("clearCart error:", err);
      throw err;
    }
  }, [user]);

  const reload = fetchServerCart;

  const value = useMemo(
    () => ({
      cart, guestItems, isLoading, error, totalItems, totalPrice,
      isDrawerOpen, openDrawer, closeDrawer,
      addItem, updateQuantity, removeItem, clearCart, reload,
    }),
    [cart, guestItems, isLoading, error, totalItems, totalPrice,
     isDrawerOpen, openDrawer, closeDrawer,
     addItem, updateQuantity, removeItem, clearCart, reload]
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

// Re-export CartItem for convenience in consuming components
export type { CartItem };
