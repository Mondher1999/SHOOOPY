"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProductCard, ProductCardSkeleton } from "@/components/products/ProductCard";
import { getAllProductsAPI } from "@/services/product-service";
import logger from "@/lib/logger";
import type { Product } from "@/types";

interface RelatedProductsProps {
  categoryId: string | null;
  excludeProductId: string;
}

export function RelatedProducts({ categoryId, excludeProductId }: RelatedProductsProps) {
  const { t } = useTranslation("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!categoryId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    getAllProductsAPI({ category: categoryId, limit: 5 })
      .then((res) => {
        if (!cancelled) {
          // Exclude the current product from related list
          setProducts(res.data.products.filter((p) => p.id !== excludeProductId).slice(0, 4));
        }
      })
      .catch((err) => {
        logger.error("RelatedProducts fetch error:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [categoryId, excludeProductId]);

  if (!categoryId || (!loading && products.length === 0)) return null;

  return (
    <section aria-labelledby="related-products-heading" className="mt-12">
      <h2 id="related-products-heading" className="text-lg font-semibold mb-4">
        {t("catalog.relatedProducts")}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {loading
          ? [...Array(4)].map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}
