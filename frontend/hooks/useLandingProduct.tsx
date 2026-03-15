"use client";

import { useState, useEffect, useMemo, useCallback, createContext, useContext, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { fetchAPI } from "@/lib/api";
import { BuyNowModal } from "@/components/products/BuyNowModal";
import logger from "@/lib/logger";
import type { Product, Review } from "@/types";

interface LandingProductContextType {
  product: Product | null;
  reviews: Review[];
  isLoading: boolean;
  error: string | null;
  onBuyNow: () => void;
}

const LandingProductContext = createContext<LandingProductContextType>({
  product: null,
  reviews: [],
  isLoading: true,
  error: null,
  onBuyNow: () => {},
});

export function LandingProductProvider({ children }: { children: ReactNode }) {
  const { t } = useTranslation("products");
  const { settings } = useSettings();
  const { user } = useAuth();
  const { toast } = useToast();
  const productId = settings?.homepage?.featuredProductId;
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [buyNowOpen, setBuyNowOpen] = useState(false);

  useEffect(() => {
    if (!productId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    Promise.all([
      fetchAPI<{ success: boolean; data: Product }>(`/api/products/${productId}`),
      fetchAPI<{ success: boolean; data: { reviews: Review[] } }>(
        `/api/reviews/product/${productId}?limit=9&sort=-rating`
      ),
    ])
      .then(([productRes, reviewsRes]) => {
        setProduct(productRes.data);
        setReviews(reviewsRes.data?.reviews || []);
      })
      .catch((err) => {
        logger.error("LandingProduct fetch error:", err);
        setError("Failed to load product");
      })
      .finally(() => setIsLoading(false));
  }, [productId]);

  const onBuyNow = useCallback(() => {
    if (!product) return;
    if (!user) {
      toast({ title: t("buyNow.loginRequired"), variant: "destructive" });
      return;
    }
    setBuyNowOpen(true);
  }, [product, user, toast, t]);

  const value = useMemo(
    () => ({ product, reviews, isLoading, error, onBuyNow }),
    [product, reviews, isLoading, error, onBuyNow]
  );

  return (
    <LandingProductContext.Provider value={value}>
      {children}
      {product && (
        <BuyNowModal
          product={product}
          open={buyNowOpen}
          onOpenChange={setBuyNowOpen}
        />
      )}
    </LandingProductContext.Provider>
  );
}

export function useLandingProduct() {
  return useContext(LandingProductContext);
}
