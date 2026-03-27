"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight, Star, ChevronLeft, ChevronRight } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import logger from "@/lib/logger";
import type { Product, Category } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ──────────────────────────── PALETTE ──────────────────────────── */
const MG = {
  black: "#000000",
  white: "#FFFFFF",
  accent: "#E63946",
  grey: "#6B6B6B",
  light: "#F5F5F5",
  border: "#E0E0E0",
} as const;

const MGPX = "px-6 md:px-16 lg:px-24";

/* ──────────────────────────── HELPERS ──────────────────────────── */

function getProductImage(product: Product, size: "thumbnail" | "medium" | "large" | "original" = "medium"): string {
  const img = product.images?.[0];
  if (!img) return "/images/homepage/products/product-1.jpg";
  const src = img[size] || img.medium || img.original;
  return src ? `${BASE_URL}${src}` : "/images/homepage/products/product-1.jpg";
}

function getCategoryImage(cat: Category): string {
  if (!cat.image) return "/images/homepage/categories/printers.png";
  return cat.image.startsWith("http") ? cat.image : `${BASE_URL}${cat.image}`;
}

/* ──────────────────────────── SKELETONS ─────────────────────────── */

function MagProductSkeleton() {
  return (
    <div className="overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full" />
      <div className="pt-4 space-y-2">
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-5 w-1/3" />
      </div>
    </div>
  );
}

function MagCategorySkeleton() {
  return (
    <div className="overflow-hidden">
      <Skeleton className="aspect-[3/4] w-full" />
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   Full-width editorial hero, oversized headline, dramatic image
   ══════════════════════════════════════════════════════════════════ */

export function MGHero() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[90vh] flex items-end overflow-hidden"
      style={{ backgroundColor: MG.black }}
    >
      {/* Background image */}
      <div className="absolute inset-0">
        <Image
          src="/images/homepage/hero/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-50"
          priority
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      </div>

      {/* Content — aligned bottom-left, editorial style */}
      <div className={`relative z-10 max-w-7xl mx-auto w-full ${MGPX} pb-20 md:pb-28 pt-40 reveal`}>
        <div className="max-w-3xl">
          {/* Red accent line */}
          <div className="w-16 h-1 mb-8" style={{ backgroundColor: MG.accent }} />

          {/* Tagline */}
          <p
            className="text-xs md:text-sm font-bold uppercase tracking-[0.3em] mb-4"
            style={{ color: MG.accent }}
          >
            {t("vitrine.hero.tagline", { defaultValue: "New Collection 2025" })}
          </p>

          {/* Main headline — large editorial */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-white mb-6">
            {t("vitrine.hero.heading", { defaultValue: "Redefine Your Style" })}
          </h1>

          {/* Subtitle */}
          <p className="text-base md:text-lg max-w-lg mb-10 leading-relaxed" style={{ color: `${MG.white}99` }}>
            {t("vitrine.hero.subtitle", { defaultValue: "Discover bold products built for those who stand out. Premium quality, unmatched design." })}
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <Link
              href="/products"
              className="inline-flex items-center gap-3 px-10 py-4 font-bold uppercase tracking-wider text-sm text-white transition-all duration-300 hover:scale-105"
              style={{ backgroundColor: MG.accent }}
            >
              {t("vitrine.hero.cta", { defaultValue: "Shop Now" })}
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
            <Link
              href="/categories"
              className="inline-flex items-center gap-3 px-10 py-4 font-bold uppercase tracking-wider text-sm text-white border-2 border-white/30 transition-all duration-300 hover:border-white"
            >
              {t("vitrine.hero.ctaSecondary", { defaultValue: "Explore Categories" })}
            </Link>
          </div>
        </div>
      </div>

      {/* Scroll indicator — thin red line */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: MG.accent }} />
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — CATEGORIES
   Magazine-style asymmetric 2-column grid
   ══════════════════════════════════════════════════════════════════ */

export function MGCategories() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>("/api/categories?limit=4&isActive=true")
      .then((res) => {
        if (res.success) setCategories(res.data.slice(0, 4));
      })
      .catch((err) => logger.error("MGCategories: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section ref={sectionRef} className={`py-20 md:py-32 ${MGPX}`} style={{ backgroundColor: MG.white }}>
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-16 reveal">
          <p
            className="text-xs font-bold uppercase tracking-[0.3em] mb-3"
            style={{ color: MG.accent }}
          >
            {t("vitrine.categories.tagline", { defaultValue: "Curated Collections" })}
          </p>
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ color: MG.black }}>
            {t("vitrine.categories.heading", { defaultValue: "Shop by Category" })}
          </h2>
          <div className="w-16 h-[2px] mt-4" style={{ backgroundColor: MG.black }} />
        </div>

        {/* Asymmetric grid — editorial feel */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 reveal-stagger">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <MagCategorySkeleton key={i} />)
            : categories.map((cat, idx) => (
                <Link
                  key={cat.id || cat.slug}
                  href={`/categories/${cat.slug}`}
                  className={`group relative overflow-hidden cursor-pointer ${
                    idx === 0 ? "md:row-span-2 aspect-[3/4]" : "aspect-[16/9]"
                  }`}
                >
                  <Image
                    src={getCategoryImage(cat)}
                    alt={cat.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                    sizes={idx === 0 ? "(max-width: 768px) 100vw, 50vw" : "(max-width: 768px) 100vw, 50vw"}
                  />
                  {/* Dark overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {/* Label */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white mb-1">
                      {cat.name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-[2px]" style={{ backgroundColor: MG.accent }} />
                      <span
                        className="text-xs font-bold uppercase tracking-[0.2em] transition-all group-hover:tracking-[0.3em]"
                        style={{ color: MG.accent }}
                      >
                        {t("vitrine.categories.explore", { defaultValue: "Explore" })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — FEATURED PRODUCTS
   Editorial product grid with large first item, sharp borders
   ══════════════════════════════════════════════════════════════════ */

export function MGFeaturedProducts() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>("/api/products?limit=8&sort=bestseller&isActive=true")
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("MGFeaturedProducts: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section ref={sectionRef} className={`py-20 md:py-32 ${MGPX}`} style={{ backgroundColor: MG.light }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-14 reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: MG.accent }}>
              {t("vitrine.featured.tagline", { defaultValue: "Top Picks" })}
            </p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ color: MG.black }}>
              {t("vitrine.featured.heading", { defaultValue: "Best Sellers" })}
            </h2>
          </div>
          <Link
            href="/products?sort=bestseller"
            className="mt-4 md:mt-0 inline-flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors"
            style={{ color: MG.black }}
          >
            {t("vitrine.featured.viewAll", { defaultValue: "View All" })}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-[1px] bg-gray-200 reveal-stagger">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white p-4">
                  <MagProductSkeleton />
                </div>
              ))
            : products.map((product) => {
                const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
                const discountPercent = hasDiscount
                  ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
                  : 0;

                return (
                  <Link
                    key={product.id}
                    href={`/products/${product.slug}`}
                    className="group cursor-pointer bg-white"
                  >
                    {/* Image */}
                    <div className="relative aspect-[3/4] overflow-hidden">
                      <Image
                        src={getProductImage(product, "medium")}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                      {/* Discount badge */}
                      {hasDiscount && (
                        <span
                          className="absolute top-3 left-3 px-3 py-1 text-[10px] font-black uppercase text-white"
                          style={{ backgroundColor: MG.accent }}
                        >
                          -{discountPercent}%
                        </span>
                      )}
                      {/* Quick add */}
                      {!isShowcase && product.stock > 0 && (
                        <button
                          type="button"
                          className="absolute bottom-0 left-0 right-0 py-3 text-xs font-bold uppercase tracking-wider text-white text-center transition-all translate-y-full group-hover:translate-y-0"
                          style={{ backgroundColor: MG.black }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            addItem(product.id, 1);
                          }}
                        >
                          {t("vitrine.featured.addToCart", { defaultValue: "Add to Cart" })}
                        </button>
                      )}
                    </div>
                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-xs font-bold uppercase tracking-wide line-clamp-1 mb-1" style={{ color: MG.black }}>
                        {product.name}
                      </h3>
                      {!isShowcase && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-black" style={{ color: MG.black }}>
                            {formatPrice(product.price)}
                          </span>
                          {hasDiscount && (
                            <span className="text-xs line-through" style={{ color: MG.grey }}>
                              {formatPrice(product.compareAtPrice!)}
                            </span>
                          )}
                        </div>
                      )}
                      {/* Rating */}
                      {product.ratings.count > 0 && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden="true" />
                          <span className="text-xs" style={{ color: MG.grey }}>
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
   SECTION 4 — PROMO BANNER
   Full-width black banner with editorial quote style
   ══════════════════════════════════════════════════════════════════ */

export function MGPromoBanner() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative py-24 md:py-36 overflow-hidden"
      style={{ backgroundColor: MG.black }}
    >
      {/* Red accent line top */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: MG.accent }} />

      <div className={`relative z-10 max-w-5xl mx-auto text-center ${MGPX} reveal`}>
        {/* Large editorial quote marks */}
        <span
          className="block text-[120px] md:text-[180px] font-serif leading-none -mb-16 md:-mb-24 opacity-10"
          style={{ color: MG.accent }}
        >
          &ldquo;
        </span>
        <p
          className="text-xs font-bold uppercase tracking-[0.3em] mb-4"
          style={{ color: MG.accent }}
        >
          {t("vitrine.promo.tagline", { defaultValue: "Limited Time Offer" })}
        </p>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter leading-[0.85] text-white mb-6">
          {t("vitrine.promo.heading", { defaultValue: "Up to 50% Off" })}
        </h2>
        <p className="text-base md:text-lg max-w-xl mx-auto mb-10" style={{ color: `${MG.white}80` }}>
          {t("vitrine.promo.subtitle", { defaultValue: "Don't miss out on our biggest sale of the season. Premium products at unbeatable prices." })}
        </p>
        <Link
          href="/products?sale=true"
          className="inline-flex items-center gap-3 px-10 py-4 font-bold uppercase tracking-wider text-sm text-white transition-all duration-300 hover:scale-105"
          style={{ backgroundColor: MG.accent }}
        >
          {t("vitrine.promo.cta", { defaultValue: "Shop the Sale" })}
          <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      </div>

      {/* Red accent line bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ backgroundColor: MG.accent }} />
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — NEW ARRIVALS
   Magazine grid layout with bold typography
   ══════════════════════════════════════════════════════════════════ */

export function MGNewArrivals() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const formatPrice = useFormatPrice();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>("/api/products?limit=8&sort=newest&isActive=true")
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("MGNewArrivals: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    const amount = scrollRef.current.clientWidth * 0.8;
    scrollRef.current.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  return (
    <section ref={sectionRef} className={`py-20 md:py-32 ${MGPX}`} style={{ backgroundColor: MG.white }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-end justify-between mb-14 reveal">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] mb-2" style={{ color: MG.accent }}>
              {t("vitrine.newArrivals.tagline", { defaultValue: "Just Dropped" })}
            </p>
            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter" style={{ color: MG.black }}>
              {t("vitrine.newArrivals.heading", { defaultValue: "New Arrivals" })}
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-1">
            <button
              type="button"
              onClick={() => scroll("left")}
              className="p-3 border transition-colors hover:bg-black hover:text-white"
              style={{ borderColor: MG.border }}
              aria-label={t("vitrine.newArrivals.prev", { defaultValue: "Previous" })}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => scroll("right")}
              className="p-3 border transition-colors hover:bg-black hover:text-white"
              style={{ borderColor: MG.border }}
              aria-label={t("vitrine.newArrivals.next", { defaultValue: "Next" })}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Horizontal scroll */}
        <div
          ref={scrollRef}
          className="flex gap-[1px] bg-gray-200 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-6 px-6 reveal-stagger"
          style={{ scrollbarWidth: "none" }}
        >
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="min-w-[280px] md:min-w-[320px] snap-start bg-white p-4">
                  <MagProductSkeleton />
                </div>
              ))
            : products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group min-w-[280px] md:min-w-[320px] snap-start cursor-pointer flex-shrink-0 bg-white"
                >
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={getProductImage(product, "medium")}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-105"
                      sizes="320px"
                    />
                    <span
                      className="absolute top-3 left-3 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-white"
                      style={{ backgroundColor: MG.accent }}
                    >
                      {t("vitrine.newArrivals.badge", { defaultValue: "New" })}
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wide line-clamp-1 mb-1" style={{ color: MG.black }}>
                      {product.name}
                    </h3>
                    {!isShowcase && (
                      <span className="text-sm font-black" style={{ color: MG.black }}>
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
   SECTION 6 — EDITORIAL
   "Editor's Pick" — large featured story block
   ══════════════════════════════════════════════════════════════════ */

export function MGEditorial() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section ref={sectionRef} className={`py-20 md:py-32 ${MGPX}`} style={{ backgroundColor: MG.light }}>
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 reveal">
          {/* Image side — full bleed */}
          <div className="relative aspect-[4/5] md:aspect-auto overflow-hidden">
            <Image
              src="/images/homepage/hero/hero-bg.jpg"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          </div>

          {/* Text side */}
          <div
            className="flex flex-col justify-center p-8 md:p-16"
            style={{ backgroundColor: MG.black }}
          >
            <div className="w-12 h-[2px] mb-8" style={{ backgroundColor: MG.accent }} />
            <p
              className="text-xs font-bold uppercase tracking-[0.3em] mb-4"
              style={{ color: MG.accent }}
            >
              {t("vitrine.editorial.tagline", { defaultValue: "Editor's Pick" })}
            </p>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black uppercase tracking-tighter leading-[0.9] text-white mb-6">
              {t("vitrine.editorial.heading", { defaultValue: "Curated Selection" })}
            </h2>
            <p className="text-base leading-relaxed mb-10" style={{ color: `${MG.white}70` }}>
              {t("vitrine.editorial.text", { defaultValue: "Our editorial team hand-picks the finest pieces that define this season's most compelling trends." })}
            </p>
            <div>
              <Link
                href="/products"
                className="inline-flex items-center gap-3 px-10 py-4 font-bold uppercase tracking-wider text-sm text-white transition-all duration-300 hover:scale-105"
                style={{ backgroundColor: MG.accent }}
              >
                {t("vitrine.editorial.cta", { defaultValue: "Read More" })}
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 7 — NEWSLETTER
   Minimal newsletter with sharp borders, editorial typography
   ══════════════════════════════════════════════════════════════════ */

export function MGNewsletter() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

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
      className={`py-20 md:py-32 ${MGPX}`}
      style={{ backgroundColor: MG.black }}
    >
      <div className="max-w-2xl mx-auto text-center reveal">
        {/* Red line */}
        <div className="w-12 h-[2px] mx-auto mb-8" style={{ backgroundColor: MG.accent }} />

        <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-white mb-4">
          {t("vitrine.newsletter.heading", { defaultValue: "Stay in the Loop" })}
        </h2>
        <p className="text-base mb-10" style={{ color: `${MG.white}60` }}>
          {t("vitrine.newsletter.subtitle", { defaultValue: "Subscribe for exclusive drops, early access, and special offers." })}
        </p>

        {status === "success" ? (
          <p className="text-lg font-bold" style={{ color: MG.accent }}>
            {t("vitrine.newsletter.success", { defaultValue: "You're in! Check your inbox." })}
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-0 max-w-lg mx-auto border border-white/20">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("vitrine.newsletter.placeholder", { defaultValue: "Enter your email" })}
              className="flex-1 px-5 py-4 text-sm bg-transparent text-white placeholder:text-white/30 focus:outline-none"
              required
              aria-label={t("vitrine.newsletter.emailLabel", { defaultValue: "Email address" })}
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="px-8 py-4 text-xs font-bold uppercase tracking-wider text-white transition-all duration-300 hover:brightness-110 disabled:opacity-50"
              style={{ backgroundColor: MG.accent }}
            >
              {status === "loading"
                ? t("vitrine.newsletter.sending", { defaultValue: "Sending..." })
                : t("vitrine.newsletter.cta", { defaultValue: "Subscribe" })}
            </button>
          </form>
        )}

        {status === "error" && (
          <p className="text-sm mt-4 text-red-400">
            {t("vitrine.newsletter.error", { defaultValue: "Something went wrong. Please try again." })}
          </p>
        )}
      </div>
    </section>
  );
}
