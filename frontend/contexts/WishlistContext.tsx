"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getWishlistAPI,
  addToWishlistAPI,
  removeFromWishlistAPI,
  clearWishlistAPI,
} from "@/services/wishlist-service";
import logger from "@/lib/logger";
import type { Wishlist } from "@/types";

// ─── Context shape ────────────────────────────────────────────────────────────

interface WishlistContextValue {
  wishlist: Wishlist | null;
  isLoading: boolean;
  /** Set of product IDs currently in the wishlist — O(1) lookup */
  wishlistIds: Set<string>;
  totalItems: number;
  addItem: (productId: string) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  toggleItem: (productId: string) => Promise<void>;
  clearAll: () => Promise<void>;
  reload: () => Promise<void>;
}

const WishlistContext = createContext<WishlistContextValue | undefined>(undefined);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ─── Fetch server wishlist ──────────────────────────────────────────────
  const fetchWishlist = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getWishlistAPI();
      setWishlist(res.data);
    } catch (err) {
      logger.error("fetchWishlist error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ─── Load on login, clear on logout ─────────────────────────────────────
  useEffect(() => {
    if (user) {
      fetchWishlist();
    } else {
      setWishlist(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // ─── Derived state ──────────────────────────────────────────────────────
  const wishlistIds = new Set(
    (wishlist?.items ?? []).map((item) => {
      // item.product can be populated (object with id) or just a string
      if (typeof item.product === "object" && item.product !== null) {
        return item.product.id;
      }
      return String(item.product);
    })
  );

  const totalItems = wishlist?.items?.length ?? 0;

  // ─── Actions ────────────────────────────────────────────────────────────
  const addItem = useCallback(async (productId: string) => {
    try {
      const res = await addToWishlistAPI(productId);
      setWishlist(res.data);
    } catch (err) {
      logger.error("wishlist addItem error:", err);
      throw err;
    }
  }, []);

  const removeItem = useCallback(async (productId: string) => {
    try {
      const res = await removeFromWishlistAPI(productId);
      setWishlist(res.data);
    } catch (err) {
      logger.error("wishlist removeItem error:", err);
      throw err;
    }
  }, []);

  const toggleItem = useCallback(
    async (productId: string) => {
      if (wishlistIds.has(productId)) {
        await removeItem(productId);
      } else {
        await addItem(productId);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [wishlistIds, addItem, removeItem]
  );

  const clearAll = useCallback(async () => {
    try {
      await clearWishlistAPI();
      setWishlist((prev) => (prev ? { ...prev, items: [] } : null));
    } catch (err) {
      logger.error("wishlist clearAll error:", err);
      throw err;
    }
  }, []);

  const reload = fetchWishlist;

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        isLoading,
        wishlistIds,
        totalItems,
        addItem,
        removeItem,
        toggleItem,
        clearAll,
        reload,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistContextValue {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}
