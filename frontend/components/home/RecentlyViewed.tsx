"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { fetchAPI } from "@/lib/api";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { ThemedProductCard, ThemedProductCardSkeleton } from "@/components/products/ThemedProductCard";
import type { Product } from "@/types";

const STORAGE_KEY = "shopflow_recently_viewed";
const MAX_STORED = 10;
const DISPLAY_LIMIT = 4;
const OBJECT_ID_RE = /^[a-f0-9]{24}$/;

/** Call this from product detail pages to track views */
export function trackProductView(productId: string) {
  if (typeof window === "undefined") return;
  if (!OBJECT_ID_RE.test(productId)) return;
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    const stored = (Array.isArray(raw) ? raw : []).filter(
      (v): v is string => typeof v === "string" && OBJECT_ID_RE.test(v)
    );
    const filtered = stored.filter((id) => id !== productId);
    filtered.unshift(productId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_STORED)));
  } catch {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([productId]));
  }
}

export function RecentlyViewed() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let ids: string[] = [];
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      const stored = (Array.isArray(raw) ? raw : []).filter(
        (v): v is string => typeof v === "string" && OBJECT_ID_RE.test(v)
      );
      ids = stored.slice(0, DISPLAY_LIMIT);
    } catch {
      ids = [];
    }
    if (ids.length === 0) {
      setIsLoading(false);
      return;
    }

    fetchAPI<{ success: boolean; data: { products: Product[] } }>(
      `/api/products?ids=${ids.join(",")}&limit=${DISPLAY_LIMIT}`
    )
      .then((res) => {
        // Preserve the order from localStorage
        const map = new Map(res.data.products.map((p) => [p.id, p]));
        const ordered = ids.map((id) => map.get(id)).filter(Boolean) as Product[];
        setProducts(ordered);
      })
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && products.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      aria-labelledby="recently-viewed-heading"
      className="py-20 md:py-[120px] px-5 md:px-[60px] bg-white"
    >
      <h2
        id="recently-viewed-heading"
        className="reveal font-heading text-2xl md:text-3xl font-medium uppercase tracking-allure text-center text-allure-text mb-12 md:mb-16"
      >
        {t("landing.recentlyViewed.heading")}
      </h2>

      <div className="max-w-[1400px] mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 reveal-stagger">
        {isLoading
          ? Array.from({ length: DISPLAY_LIMIT }).map((_, i) => (
              <ThemedProductCardSkeleton key={`skeleton-${i}`} />
            ))
          : products.map((product) => (
              <div key={product.id} className="reveal">
                <ThemedProductCard product={product} />
              </div>
            ))}
      </div>
    </section>
  );
}
