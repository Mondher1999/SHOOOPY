"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { fetchAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useSettings } from "@/contexts/SettingsContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import type { Product, PaginationInfo } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

export function NewArrivals() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const sectionRef = useScrollReveal<HTMLElement>();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const na = settings?.homepage?.newArrivals;
  const title = na?.title || t("landing.newArrivals.heading");
  const limit = na?.limit || 4;

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[]; pagination: PaginationInfo } }>(
      `/api/products?sort=-createdAt&limit=${limit}`
    )
      .then((res) => setProducts(res.data.products))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, [limit]);

  return (
    <section
      ref={sectionRef}
      aria-labelledby="new-arrivals-heading"
      className="py-20 md:py-[120px] px-5 md:px-[60px] bg-allure-bg"
    >
      <h2
        id="new-arrivals-heading"
        className="reveal font-heading text-2xl md:text-3xl font-medium uppercase tracking-allure text-center text-allure-text mb-12 md:mb-16"
      >
        {title}
      </h2>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[3px] max-w-[1400px] mx-auto">
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i}>
              <Skeleton className="aspect-[4/5] w-full mb-3" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/4" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-center text-sm text-allure-text-muted">
          {t("landing.newArrivals.empty")}
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-[3px] max-w-[1400px] mx-auto reveal-stagger">
            {products.map((product) => {
              const secondImage = product.images[1] ?? null;
              return (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="reveal group block cursor-pointer"
                >
                  <div
                    className={`allure-img-zoom relative aspect-[4/5] ${secondImage ? "allure-product-images" : ""}`}
                  >
                    {product.images[0] ? (
                      <>
                        <Image
                          src={`${BASE_URL}${product.images[0]?.medium}`}
                          alt={product.name}
                          fill
                          className={`object-cover ${secondImage ? "allure-product-img-primary" : ""}`}
                          sizes="(max-width: 768px) 50vw, 25vw"
                        />
                        {secondImage && (
                          <Image
                            src={`${BASE_URL}${secondImage.medium}`}
                            alt=""
                            aria-hidden="true"
                            fill
                            className="object-cover allure-product-img-secondary"
                            sizes="(max-width: 768px) 50vw, 25vw"
                          />
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full bg-allure-bg-alt" />
                    )}
                    <span className="absolute top-3 left-3 bg-allure-dark text-allure-text-on-dark font-heading uppercase tracking-allure text-[10px] font-medium px-3 py-1 z-10">
                      {t("landing.newArrivals.badge")}
                    </span>
                  </div>
                  <div className="pt-4 pb-6 px-1">
                    <h3 className="font-heading text-sm md:text-[15px] font-medium text-allure-text mb-1 group-hover:opacity-70 transition-opacity">
                      {product.name}
                    </h3>
                    {!isShowcase && (
                      <p className="text-sm text-allure-text-muted">
                        {formatPrice(product.price)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="reveal text-center mt-12">
            <Link
              href="/products"
              className="allure-link text-xs uppercase tracking-allure font-heading font-medium text-allure-text cursor-pointer"
            >
              {t("landing.newArrivals.viewAll")}
            </Link>
          </div>
        </>
      )}
    </section>
  );
}
