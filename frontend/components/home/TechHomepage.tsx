"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import logger from "@/lib/logger";
import type { Product, Category } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ──────────────────────────── PALETTE ──────────────────────────── */

const TK = {
  bg: "#0A0A0F",
  surface: "#12121A",
  neon: "#00FF88",
  cyan: "#00D4FF",
  purple: "#8B5CF6",
  text: "#E0E0E0",
  muted: "#555566",
  border: "#1E1E2A",
} as const;

const TKPX = "px-6 md:px-16 lg:px-24";

/* ──────────────────────────── HELPERS ──────────────────────────── */

function formatPrice(price: number): string {
  return `${price.toLocaleString()} DT`;
}

function getProductImage(
  product: Product,
  size: "thumbnail" | "medium" | "large" | "original" = "medium"
): string {
  const img = product.images?.[0];
  if (!img) return "/images/homepage/products/product-1.jpg";
  const src = img[size] || img.medium || img.original;
  return src ? `${BASE_URL}${src}` : "/images/homepage/products/product-1.jpg";
}

function getCategoryImage(cat: Category): string {
  if (!cat.image) return "/images/homepage/categories/printers.png";
  return cat.image.startsWith("http") ? cat.image : `${BASE_URL}${cat.image}`;
}

/* ──────────────────────────── ANIMATED COUNTER ──────────────────── */

function AnimatedCounter({
  target,
  suffix = "",
}: {
  target: number;
  suffix?: string;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          const duration = 2000;
          const start = performance.now();

          const tick = (now: number) => {
            const elapsed = now - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.floor(eased * target));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [target]);

  return (
    <span ref={ref}>
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}

/* ──────────────────────────── SKELETONS ─────────────────────────── */

function TKProductSkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ backgroundColor: TK.surface, border: `1px solid ${TK.border}` }}
    >
      <Skeleton className="aspect-[3/4] w-full bg-[#1E1E2A]" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3 bg-[#1E1E2A]" />
        <Skeleton className="h-5 w-1/3 bg-[#1E1E2A]" />
      </div>
    </div>
  );
}

function TKCategorySkeleton() {
  return (
    <div
      className="overflow-hidden rounded-lg"
      style={{ backgroundColor: TK.surface, border: `1px solid ${TK.border}` }}
    >
      <Skeleton className="aspect-square w-full bg-[#1E1E2A]" />
      <div className="p-4">
        <Skeleton className="h-4 w-1/2 bg-[#1E1E2A]" />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — TK HERO
   Full-screen dark hero with grid pattern, gradient text, scan line
   ══════════════════════════════════════════════════════════════════ */

export function TKHero() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: TK.bg }}
    >
      {/* Dot-grid pattern background */}
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage: `radial-gradient(${TK.neon} 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Radial glow behind content */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full opacity-[0.06]"
        style={{
          background: `radial-gradient(circle, ${TK.neon}, transparent 70%)`,
        }}
      />

      {/* Animated scan line */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(to bottom, transparent 0%, transparent 48%, rgba(0,255,136,0.03) 50%, transparent 52%, transparent 100%)`,
          backgroundSize: "100% 200%",
          animation: "tkScanLine 8s linear infinite",
        }}
      />

      {/* CSS keyframes for scan line */}
      <style jsx>{`
        @keyframes tkScanLine {
          0% {
            background-position: 0% 0%;
          }
          100% {
            background-position: 0% 200%;
          }
        }
      `}</style>

      {/* Content */}
      <div
        className={`relative z-10 text-center max-w-5xl mx-auto ${TKPX} py-20 reveal`}
      >
        {/* Monospace tagline */}
        <p
          className="font-mono text-xs md:text-sm uppercase tracking-[0.4em] mb-6"
          style={{ color: TK.neon }}
        >
          {t("vitrine.hero.tagline", {
            defaultValue: "// Next-Gen Technology",
          })}
        </p>

        {/* Gradient headline */}
        <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-extrabold uppercase tracking-tight leading-[0.95] mb-8 bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
          {t("vitrine.hero.heading", {
            defaultValue: "The Future Is Now",
          })}
        </h1>

        {/* Subtitle */}
        <p
          className="text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-12 leading-relaxed"
          style={{ color: TK.text }}
        >
          {t("vitrine.hero.subtitle", {
            defaultValue:
              "Explore cutting-edge products engineered for performance. Precision design meets uncompromising quality.",
          })}
        </p>

        {/* Neon CTA button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/products"
            className="group inline-flex items-center gap-3 px-10 py-4 font-mono font-bold uppercase tracking-wider text-sm transition-all duration-300"
            style={{
              border: `1px solid ${TK.neon}`,
              color: TK.neon,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(0,255,136,0.1)";
              e.currentTarget.style.boxShadow =
                "0 0 20px rgba(0,255,136,0.3), inset 0 0 20px rgba(0,255,136,0.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            {t("vitrine.hero.cta", { defaultValue: "Explore Products" })}
            <ArrowRight
              className="h-5 w-5 transition-transform group-hover:translate-x-1"
              aria-hidden="true"
            />
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center gap-3 px-10 py-4 font-mono font-bold uppercase tracking-wider text-sm transition-all duration-300"
            style={{
              border: `1px solid ${TK.border}`,
              color: TK.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = TK.cyan;
              e.currentTarget.style.color = TK.cyan;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = TK.border;
              e.currentTarget.style.color = TK.text;
            }}
          >
            {t("vitrine.hero.ctaSecondary", {
              defaultValue: "Browse Categories",
            })}
          </Link>
        </div>
      </div>

      {/* Bottom fade-out */}
      <div
        className="absolute bottom-0 left-0 right-0 h-32"
        style={{
          background: `linear-gradient(to top, ${TK.bg}, transparent)`,
        }}
      />
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — TK CATEGORIES
   Dark category cards with neon border on hover
   ══════════════════════════════════════════════════════════════════ */

export function TKCategories() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>(
      "/api/categories?limit=6&isActive=true"
    )
      .then((res) => {
        if (res.success) setCategories(res.data.slice(0, 6));
      })
      .catch((err) => logger.error("TKCategories: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`py-20 md:py-32 ${TKPX}`}
      style={{ backgroundColor: TK.bg }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 reveal">
          <p
            className="font-mono text-xs uppercase tracking-[0.3em] mb-3"
            style={{ color: TK.muted }}
          >
            {t("vitrine.categories.tagline", {
              defaultValue: "[ Categories ]",
            })}
          </p>
          <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
            {t("vitrine.categories.heading", {
              defaultValue: "Shop by Category",
            })}
          </h2>
          <div
            className="w-20 h-px mx-auto mt-6"
            style={{ backgroundColor: TK.border }}
          />
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 reveal-stagger">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <TKCategorySkeleton key={i} />
              ))
            : categories.map((cat) => (
                <Link
                  key={cat.id || cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="group relative rounded-lg overflow-hidden transition-all duration-500"
                  style={{
                    backgroundColor: TK.surface,
                    border: `1px solid ${TK.border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = TK.neon;
                    e.currentTarget.style.boxShadow = `0 0 25px rgba(0,255,136,0.15), 0 0 50px rgba(0,255,136,0.05)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = TK.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden">
                    <Image
                      src={getCategoryImage(cat)}
                      alt={cat.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-70 group-hover:opacity-90"
                      sizes="(max-width: 768px) 50vw, 33vw"
                    />
                    {/* Dark gradient overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, ${TK.surface} 0%, transparent 60%)`,
                      }}
                    />
                  </div>

                  {/* Label */}
                  <div className="p-4 md:p-5">
                    <h3
                      className="font-mono text-xs md:text-sm font-bold uppercase tracking-[0.15em] mb-2"
                      style={{ color: TK.text }}
                    >
                      {cat.name}
                    </h3>
                    <span
                      className="inline-flex items-center gap-1 font-mono text-[10px] md:text-xs uppercase tracking-wider transition-all group-hover:gap-2"
                      style={{ color: TK.neon }}
                    >
                      {t("vitrine.categories.explore", {
                        defaultValue: "Explore",
                      })}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — TK FEATURED PRODUCTS
   Product grid on dark cards with neon price and hover glow
   ══════════════════════════════════════════════════════════════════ */

export function TKFeaturedProducts() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>(
      "/api/products?limit=8&sort=bestseller&isActive=true"
    )
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("TKFeaturedProducts: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section
      ref={sectionRef}
      className={`py-20 md:py-32 ${TKPX}`}
      style={{ backgroundColor: TK.bg }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 reveal">
          <div>
            <p
              className="font-mono text-xs uppercase tracking-[0.3em] mb-3"
              style={{ color: TK.muted }}
            >
              {t("vitrine.featured.tagline", {
                defaultValue: "[ Best Sellers ]",
              })}
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
              {t("vitrine.featured.heading", {
                defaultValue: "Featured Products",
              })}
            </h2>
          </div>
          <Link
            href="/products?sort=bestseller"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 font-mono text-xs uppercase tracking-wider transition-colors"
            style={{ color: TK.muted }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = TK.neon;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = TK.muted;
            }}
          >
            {t("vitrine.featured.viewAll", { defaultValue: "View All" })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 reveal-stagger">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <TKProductSkeleton key={i} />
              ))
            : products.map((product) => {
                const hasDiscount =
                  product.compareAtPrice &&
                  product.compareAtPrice > product.price;
                const discountPercent = hasDiscount
                  ? Math.round(
                      ((product.compareAtPrice! - product.price) /
                        product.compareAtPrice!) *
                        100
                    )
                  : 0;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group cursor-pointer rounded-lg overflow-hidden transition-all duration-500"
                    style={{
                      backgroundColor: TK.surface,
                      border: `1px solid ${TK.border}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = TK.neon;
                      e.currentTarget.style.boxShadow = `0 0 30px rgba(0,255,136,0.12), 0 0 60px rgba(0,255,136,0.04)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = TK.border;
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  >
                    {/* Image container */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={getProductImage(product, "medium")}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />

                      {/* Dark gradient overlay */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background: `linear-gradient(to top, ${TK.surface} 0%, transparent 50%)`,
                        }}
                      />

                      {/* Discount badge */}
                      {hasDiscount && (
                        <span
                          className="absolute top-3 left-3 px-2 py-1 font-mono text-[10px] font-bold uppercase rounded"
                          style={{
                            backgroundColor: "rgba(139,92,246,0.9)",
                            color: "#FFFFFF",
                            boxShadow: "0 0 12px rgba(139,92,246,0.4)",
                          }}
                        >
                          -{discountPercent}%
                        </span>
                      )}

                      {/* Add to cart on hover */}
                      {!isShowcase && product.stock > 0 && (
                        <button
                          type="button"
                          className="absolute bottom-0 left-0 right-0 py-3 font-mono text-[10px] md:text-xs font-bold uppercase tracking-wider text-center transition-all duration-300 translate-y-full group-hover:translate-y-0"
                          style={{
                            border: `1px solid ${TK.neon}`,
                            color: TK.neon,
                            backgroundColor: "rgba(10,10,15,0.95)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(0,255,136,0.1)";
                            e.currentTarget.style.boxShadow =
                              "0 0 20px rgba(0,255,136,0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(10,10,15,0.95)";
                            e.currentTarget.style.boxShadow = "none";
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItem(product.id, 1);
                          }}
                        >
                          {t("vitrine.featured.addToCart", {
                            defaultValue: "Add to Cart",
                          })}
                        </button>
                      )}
                    </div>

                    {/* Product info */}
                    <div className="p-4">
                      <h3
                        className="text-sm font-medium line-clamp-1 mb-2"
                        style={{ color: TK.text }}
                      >
                        {product.name}
                      </h3>

                      {!isShowcase && (
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className="font-mono text-sm font-bold"
                            style={{ color: TK.neon }}
                          >
                            {formatPrice(product.price)}
                          </span>
                          {hasDiscount && (
                            <span
                              className="font-mono text-xs line-through"
                              style={{ color: TK.muted }}
                            >
                              {formatPrice(product.compareAtPrice!)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Rating */}
                      {product.ratings.count > 0 && (
                        <div className="flex items-center gap-1">
                          <Star
                            className="h-3 w-3 fill-amber-400 text-amber-400"
                            aria-hidden="true"
                          />
                          <span
                            className="font-mono text-[10px]"
                            style={{ color: TK.muted }}
                          >
                            {product.ratings.average.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — TK PROMO BANNER
   Full-width with animated gradient border and pulsing glow
   ══════════════════════════════════════════════════════════════════ */

export function TKPromoBanner() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className={`py-20 md:py-32 ${TKPX}`}
      style={{ backgroundColor: TK.bg }}
    >
      {/* Animated gradient border wrapper */}
      <div
        className="relative max-w-5xl mx-auto rounded-xl overflow-hidden reveal"
        style={{ padding: "1px" }}
      >
        {/* Animated gradient border */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${TK.purple}, ${TK.cyan}, ${TK.neon}, ${TK.purple})`,
            backgroundSize: "300% 300%",
            animation: "tkGradientShift 6s ease infinite",
          }}
        />

        {/* Pulsing outer glow */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            boxShadow: `0 0 40px rgba(0,212,255,0.15), 0 0 80px rgba(139,92,246,0.08)`,
            animation: "tkPulseGlow 4s ease-in-out infinite",
          }}
        />

        {/* Inner content area */}
        <div
          className="relative rounded-xl py-16 md:py-24 px-6 md:px-16 text-center"
          style={{ backgroundColor: TK.bg }}
        >
          {/* Subtle background grid */}
          <div
            className="absolute inset-0 opacity-[0.04] rounded-xl"
            style={{
              backgroundImage: `linear-gradient(${TK.cyan} 1px, transparent 1px), linear-gradient(90deg, ${TK.cyan} 1px, transparent 1px)`,
              backgroundSize: "60px 60px",
            }}
          />

          <div className="relative z-10">
            <p
              className="font-mono text-xs uppercase tracking-[0.4em] mb-4"
              style={{ color: TK.purple }}
            >
              {t("vitrine.promo.tagline", {
                defaultValue: "// Limited Time Offer",
              })}
            </p>

            <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold uppercase tracking-tight leading-[0.95] mb-6 bg-gradient-to-r from-[#8B5CF6] via-[#00D4FF] to-[#00FF88] bg-clip-text text-transparent">
              {t("vitrine.promo.heading", {
                defaultValue: "Up to 50% Off",
              })}
            </h2>

            <p
              className="text-base md:text-lg max-w-xl mx-auto mb-10 leading-relaxed"
              style={{ color: TK.text }}
            >
              {t("vitrine.promo.subtitle", {
                defaultValue:
                  "Unlock exclusive deals on premium tech. Engineered for performance, priced for everyone.",
              })}
            </p>

            <Link
              href="/products?sale=true"
              className="inline-flex items-center gap-3 px-10 py-4 font-mono font-bold uppercase tracking-wider text-sm transition-all duration-300"
              style={{
                border: `1px solid ${TK.neon}`,
                color: TK.neon,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor =
                  "rgba(0,255,136,0.1)";
                e.currentTarget.style.boxShadow =
                  "0 0 25px rgba(0,255,136,0.35), inset 0 0 25px rgba(0,255,136,0.05)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.boxShadow = "none";
              }}
            >
              {t("vitrine.promo.cta", { defaultValue: "Shop the Sale" })}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style jsx>{`
        @keyframes tkGradientShift {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @keyframes tkPulseGlow {
          0%,
          100% {
            opacity: 0.6;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — TK NEW ARRIVALS
   Horizontal scroll with neon "NEW" badge and glow
   ══════════════════════════════════════════════════════════════════ */

export function TKNewArrivals() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>(
      "/api/products?limit=8&sort=newest&isActive=true"
    )
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("TKNewArrivals: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -amount : amount,
      behavior: "smooth",
    });
  };

  return (
    <section
      ref={sectionRef}
      className={`py-20 md:py-32 ${TKPX}`}
      style={{ backgroundColor: TK.surface }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-12 reveal">
          <div>
            <p
              className="font-mono text-xs uppercase tracking-[0.3em] mb-3"
              style={{ color: TK.muted }}
            >
              {t("vitrine.newArrivals.tagline", {
                defaultValue: "[ Just Dropped ]",
              })}
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold uppercase tracking-tight bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
              {t("vitrine.newArrivals.heading", {
                defaultValue: "New Arrivals",
              })}
            </h2>
          </div>

          {/* Navigation arrows */}
          <div className="hidden md:flex items-center gap-2">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="p-3 rounded transition-all duration-300"
              style={{
                border: `1px solid ${TK.border}`,
                color: TK.muted,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = TK.neon;
                e.currentTarget.style.color = TK.neon;
                e.currentTarget.style.boxShadow =
                  "0 0 15px rgba(0,255,136,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = TK.border;
                e.currentTarget.style.color = TK.muted;
                e.currentTarget.style.boxShadow = "none";
              }}
              aria-label={t("vitrine.newArrivals.prev", {
                defaultValue: "Previous",
              })}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="p-3 rounded transition-all duration-300"
              style={{
                border: `1px solid ${TK.border}`,
                color: TK.muted,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = TK.neon;
                e.currentTarget.style.color = TK.neon;
                e.currentTarget.style.boxShadow =
                  "0 0 15px rgba(0,255,136,0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = TK.border;
                e.currentTarget.style.color = TK.muted;
                e.currentTarget.style.boxShadow = "none";
              }}
              aria-label={t("vitrine.newArrivals.next", {
                defaultValue: "Next",
              })}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll container */}
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-6 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 reveal-stagger"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="min-w-[260px] md:min-w-[300px] snap-start"
                >
                  <TKProductSkeleton />
                </div>
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group min-w-[260px] md:min-w-[300px] snap-start cursor-pointer flex-shrink-0 rounded-lg overflow-hidden transition-all duration-500"
                  style={{
                    backgroundColor: TK.bg,
                    border: `1px solid ${TK.border}`,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = TK.cyan;
                    e.currentTarget.style.boxShadow = `0 0 25px rgba(0,212,255,0.12), 0 0 50px rgba(0,212,255,0.04)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = TK.border;
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={getProductImage(product, "medium")}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-80 group-hover:opacity-100"
                      sizes="300px"
                    />

                    {/* Overlay */}
                    <div
                      className="absolute inset-0"
                      style={{
                        background: `linear-gradient(to top, ${TK.bg} 0%, transparent 50%)`,
                      }}
                    />

                    {/* NEW badge with glow */}
                    <span
                      className="absolute top-3 left-3 px-3 py-1 font-mono text-[10px] font-bold uppercase tracking-wider rounded"
                      style={{
                        backgroundColor: TK.neon,
                        color: TK.bg,
                        boxShadow: `0 0 15px rgba(0,255,136,0.5), 0 0 30px rgba(0,255,136,0.2)`,
                      }}
                    >
                      {t("vitrine.newArrivals.badge", {
                        defaultValue: "New",
                      })}
                    </span>
                  </div>

                  {/* Product info */}
                  <div className="p-4">
                    <h3
                      className="text-sm font-medium line-clamp-1 mb-2"
                      style={{ color: TK.text }}
                    >
                      {product.name}
                    </h3>
                    {!isShowcase && (
                      <span
                        className="font-mono text-sm font-bold"
                        style={{ color: TK.neon }}
                      >
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 6 — TK SOCIAL PROOF
   Stats with gradient numbers on dark bg with subtle grid
   ══════════════════════════════════════════════════════════════════ */

export function TKSocialProof() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  const stats = [
    {
      value: 5000,
      suffix: "+",
      label: t("vitrine.socialProof.ordersDelivered", {
        defaultValue: "Orders Delivered",
      }),
    },
    {
      value: 3200,
      suffix: "+",
      label: t("vitrine.socialProof.happyCustomers", {
        defaultValue: "Happy Customers",
      }),
    },
    {
      value: 500,
      suffix: "+",
      label: t("vitrine.socialProof.products", {
        defaultValue: "Products",
      }),
    },
    {
      value: 98,
      suffix: "%",
      label: t("vitrine.socialProof.satisfaction", {
        defaultValue: "Satisfaction Rate",
      }),
    },
  ];

  return (
    <section
      ref={sectionRef}
      className={`relative py-20 md:py-28 ${TKPX} overflow-hidden`}
      style={{ backgroundColor: TK.bg }}
    >
      {/* Subtle grid lines */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage: `linear-gradient(${TK.neon} 1px, transparent 1px), linear-gradient(90deg, ${TK.neon} 1px, transparent 1px)`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Top and bottom borders */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${TK.border}, transparent)`,
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: `linear-gradient(to right, transparent, ${TK.border}, transparent)`,
        }}
      />

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12 text-center reveal-stagger">
          {stats.map((stat) => (
            <div key={stat.label} className="relative">
              {/* Stat number with gradient */}
              <p className="text-4xl md:text-5xl lg:text-6xl font-extrabold mb-3 bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
                <AnimatedCounter target={stat.value} suffix={stat.suffix} />
              </p>
              {/* Label */}
              <p
                className="font-mono text-[10px] md:text-xs uppercase tracking-[0.2em]"
                style={{ color: TK.muted }}
              >
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — TK NEWSLETTER
   Dark surface with gradient border, neon input focus
   ══════════════════════════════════════════════════════════════════ */

export function TKNewsletter() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus("loading");
    try {
      await fetchAPI("/api/subscribers", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`py-20 md:py-32 ${TKPX}`}
      style={{ backgroundColor: TK.bg }}
    >
      {/* Gradient-bordered card */}
      <div
        className="relative max-w-2xl mx-auto rounded-xl overflow-hidden reveal"
        style={{ padding: "1px" }}
      >
        {/* Gradient border */}
        <div
          className="absolute inset-0 rounded-xl"
          style={{
            background: `linear-gradient(135deg, ${TK.neon}, ${TK.cyan}, ${TK.purple})`,
            opacity: 0.5,
          }}
        />

        {/* Inner content */}
        <div
          className="relative rounded-xl py-12 md:py-16 px-6 md:px-12 text-center"
          style={{ backgroundColor: TK.surface }}
        >
          {/* Decorative corner accents */}
          <div
            className="absolute top-4 left-4 w-6 h-6"
            style={{
              borderTop: `1px solid ${TK.neon}`,
              borderLeft: `1px solid ${TK.neon}`,
              opacity: 0.4,
            }}
          />
          <div
            className="absolute top-4 right-4 w-6 h-6"
            style={{
              borderTop: `1px solid ${TK.neon}`,
              borderRight: `1px solid ${TK.neon}`,
              opacity: 0.4,
            }}
          />
          <div
            className="absolute bottom-4 left-4 w-6 h-6"
            style={{
              borderBottom: `1px solid ${TK.neon}`,
              borderLeft: `1px solid ${TK.neon}`,
              opacity: 0.4,
            }}
          />
          <div
            className="absolute bottom-4 right-4 w-6 h-6"
            style={{
              borderBottom: `1px solid ${TK.neon}`,
              borderRight: `1px solid ${TK.neon}`,
              opacity: 0.4,
            }}
          />

          {/* Monospace label */}
          <p
            className="font-mono text-xs uppercase tracking-[0.3em] mb-4"
            style={{ color: TK.muted }}
          >
            {t("vitrine.newsletter.tagline", {
              defaultValue: "[ Stay Connected ]",
            })}
          </p>

          {/* Gradient headline */}
          <h2 className="text-3xl md:text-4xl font-extrabold uppercase tracking-tight mb-4 bg-gradient-to-r from-[#00FF88] to-[#00D4FF] bg-clip-text text-transparent">
            {t("vitrine.newsletter.heading", {
              defaultValue: "Join the Network",
            })}
          </h2>

          <p
            className="text-sm md:text-base mb-10 max-w-md mx-auto leading-relaxed"
            style={{ color: TK.muted }}
          >
            {t("vitrine.newsletter.subtitle", {
              defaultValue:
                "Get early access to new drops, exclusive offers, and tech updates delivered straight to your inbox.",
            })}
          </p>

          {status === "success" ? (
            <p className="font-mono text-lg font-bold" style={{ color: TK.neon }}>
              {t("vitrine.newsletter.success", {
                defaultValue: "You're in! Check your inbox.",
              })}
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col sm:flex-row gap-3 max-w-lg mx-auto"
            >
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("vitrine.newsletter.placeholder", {
                  defaultValue: "Enter your email",
                })}
                className="flex-1 px-5 py-4 text-sm rounded font-mono transition-all duration-300 outline-none"
                style={{
                  backgroundColor: TK.bg,
                  border: `1px solid ${TK.border}`,
                  color: TK.text,
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = TK.neon;
                  e.currentTarget.style.boxShadow =
                    "0 0 10px rgba(0,255,136,0.2)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = TK.border;
                  e.currentTarget.style.boxShadow = "none";
                }}
                required
                aria-label={t("vitrine.newsletter.emailLabel", {
                  defaultValue: "Email address",
                })}
              />
              <button
                type="submit"
                disabled={status === "loading"}
                className="px-8 py-4 font-mono text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded disabled:opacity-40"
                style={{
                  border: `1px solid ${TK.neon}`,
                  color: TK.neon,
                  backgroundColor: "transparent",
                }}
                onMouseEnter={(e) => {
                  if (status !== "loading") {
                    e.currentTarget.style.backgroundColor =
                      "rgba(0,255,136,0.1)";
                    e.currentTarget.style.boxShadow =
                      "0 0 20px rgba(0,255,136,0.3)";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                {status === "loading"
                  ? t("vitrine.newsletter.sending", {
                      defaultValue: "Sending...",
                    })
                  : t("vitrine.newsletter.cta", {
                      defaultValue: "Subscribe",
                    })}
              </button>
            </form>
          )}

          {status === "error" && (
            <p className="font-mono text-sm mt-4" style={{ color: "#FF4444" }}>
              {t("vitrine.newsletter.error", {
                defaultValue: "Something went wrong. Please try again.",
              })}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
