"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { ArrowRight, Star } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { fetchAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import logger from "@/lib/logger";
import type { Product, Category } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ──────────────────────────── PALETTE ──────────────────────────── */
const MN = {
  bg: "#FFFFFF",
  text: "#111111",
  muted: "#999999",
  border: "#EEEEEE",
  accent: "#111111",
  bgAlt: "#FAFAFA",
} as const;

const MNPX = "px-6 md:px-16 lg:px-24";

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

/* ──────────────────────────── SKELETONS ─────────────────────────── */

function MNProductSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-[3/4] w-full mb-4" />
      <Skeleton className="h-4 w-3/4 mb-2" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  );
}

function MNCategorySkeleton() {
  return <Skeleton className="h-5 w-24 inline-block" />;
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 1 — HERO
   Ultra-clean hero with thin typography and abundant whitespace
   ══════════════════════════════════════════════════════════════════ */

export function MNHero() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[85vh] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: MN.bg }}
    >
      {/* Optional background image at very low opacity */}
      <div className="absolute inset-0">
        <Image
          src="/images/homepage/hero/hero-bg.jpg"
          alt=""
          fill
          className="object-cover opacity-[0.04]"
          priority
          sizes="100vw"
        />
      </div>

      {/* Content */}
      <div className={`relative z-10 text-center max-w-3xl mx-auto ${MNPX} py-24 md:py-40 reveal`}>
        {/* Main headline — thin, light, tracking-tight */}
        <h1
          className="text-4xl md:text-6xl lg:text-7xl font-extralight tracking-tight leading-[1.1] mb-6"
          style={{ color: MN.text }}
        >
          {t("vitrine.mnHero.heading", { defaultValue: "Less is More" })}
        </h1>

        {/* Minimal subtext */}
        <p
          className="text-sm md:text-base font-light max-w-md mx-auto mb-12 leading-relaxed"
          style={{ color: MN.muted }}
        >
          {t("vitrine.mnHero.subtitle", {
            defaultValue: "Curated essentials, thoughtfully designed.",
          })}
        </p>

        {/* Single underlined text CTA link */}
        <Link
          href="/products"
          className="inline-flex items-center gap-2 text-sm tracking-wide underline underline-offset-4 decoration-1 transition-opacity hover:opacity-60"
          style={{ color: MN.text }}
        >
          {t("vitrine.mnHero.cta", { defaultValue: "Shop Collection" })}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 2 — FEATURED PRODUCTS
   Simple 4-column grid, no borders, just image + name + price
   ══════════════════════════════════════════════════════════════════ */

export function MNFeaturedProducts() {
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
      .catch((err) => logger.error("MNFeaturedProducts: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && products.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-40 ${MNPX}`}
      style={{ backgroundColor: MN.bg }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16 reveal">
          <h2
            className="text-2xl md:text-3xl font-extralight tracking-tight"
            style={{ color: MN.text }}
          >
            {t("vitrine.mnFeatured.heading", { defaultValue: "Selected Pieces" })}
          </h2>
        </div>

        {/* Product grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 reveal-stagger">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <MNProductSkeleton key={i} />)
            : products.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] overflow-hidden mb-4 transition-shadow duration-500 group-hover:shadow-lg">
                    <Image
                      src={getProductImage(product, "medium")}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />

                    {/* Quiet add-to-cart on hover */}
                    {!isShowcase && product.stock > 0 && (
                      <button
                        type="button"
                        className="absolute bottom-0 left-0 right-0 py-3 text-[11px] tracking-widest uppercase text-center transition-all translate-y-full group-hover:translate-y-0"
                        style={{ backgroundColor: MN.text, color: MN.bg }}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem(product.id, 1);
                        }}
                        aria-label={t("vitrine.mnFeatured.addToCart", {
                          defaultValue: "Add to cart",
                        })}
                      >
                        {t("vitrine.mnFeatured.addToCart", {
                          defaultValue: "Add to Cart",
                        })}
                      </button>
                    )}
                  </div>

                  {/* Name */}
                  <h3
                    className="text-xs md:text-sm font-light line-clamp-1 mb-1"
                    style={{ color: MN.text }}
                  >
                    {product.name}
                  </h3>

                  {/* Price */}
                  {!isShowcase && (
                    <div className="flex items-center gap-2">
                      <span
                        className="text-xs md:text-sm font-light"
                        style={{ color: MN.muted }}
                      >
                        {formatPrice(product.price)}
                      </span>
                      {product.compareAtPrice &&
                        product.compareAtPrice > product.price && (
                          <span
                            className="text-xs line-through"
                            style={{ color: MN.border }}
                          >
                            {formatPrice(product.compareAtPrice)}
                          </span>
                        )}
                    </div>
                  )}
                </Link>
              ))}
        </div>

        {/* View all link */}
        <div className="text-center mt-16 reveal">
          <Link
            href="/products"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase underline underline-offset-4 decoration-1 transition-opacity hover:opacity-60"
            style={{ color: MN.text }}
          >
            {t("vitrine.mnFeatured.viewAll", { defaultValue: "View All" })}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 3 — NEW ARRIVALS
   Asymmetric layout: 1 large featured image left, 2x2 grid right
   ══════════════════════════════════════════════════════════════════ */

export function MNNewArrivals() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const isShowcase = useShowcase();
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>(
      "/api/products?limit=5&sort=newest&isActive=true"
    )
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("MNNewArrivals: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && products.length === 0) return null;

  const featured = products[0] ?? null;
  const grid = products.slice(1, 5);

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-40 ${MNPX}`}
      style={{ backgroundColor: MN.bgAlt }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="mb-16 reveal">
          <h2
            className="text-2xl md:text-3xl font-extralight tracking-tight"
            style={{ color: MN.text }}
          >
            {t("vitrine.mnNewArrivals.heading", { defaultValue: "New Arrivals" })}
          </h2>
          <div
            className="w-12 h-px mt-4"
            style={{ backgroundColor: MN.border }}
          />
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <Skeleton className="aspect-[3/4] w-full" />
            <div className="grid grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <MNProductSkeleton key={i} />
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 reveal-stagger">
            {/* Large featured product on the left */}
            {featured && (
              <Link
                href={`/products/${featured.slug}`}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[3/4] overflow-hidden transition-shadow duration-500 group-hover:shadow-lg">
                  <Image
                    src={getProductImage(featured, "large")}
                    alt={featured.name}
                    fill
                    className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
                <div className="mt-4">
                  <h3
                    className="text-sm font-light line-clamp-1 mb-1"
                    style={{ color: MN.text }}
                  >
                    {featured.name}
                  </h3>
                  {!isShowcase && (
                    <span
                      className="text-sm font-light"
                      style={{ color: MN.muted }}
                    >
                      {formatPrice(featured.price)}
                    </span>
                  )}
                </div>
              </Link>
            )}

            {/* 2x2 grid of smaller products on the right */}
            <div className="grid grid-cols-2 gap-6">
              {grid.map((product) => (
                <Link
                  key={product.id}
                  href={`/products/${product.slug}`}
                  className="group cursor-pointer"
                >
                  <div className="relative aspect-[3/4] overflow-hidden transition-shadow duration-500 group-hover:shadow-lg">
                    <Image
                      src={getProductImage(product, "medium")}
                      alt={product.name}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  </div>
                  <div className="mt-3">
                    <h3
                      className="text-xs font-light line-clamp-1 mb-1"
                      style={{ color: MN.text }}
                    >
                      {product.name}
                    </h3>
                    {!isShowcase && (
                      <span
                        className="text-xs font-light"
                        style={{ color: MN.muted }}
                      >
                        {formatPrice(product.price)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 4 — CATEGORIES
   Horizontal text-only links with thin dividers — purely typographic
   ══════════════════════════════════════════════════════════════════ */

export function MNCategories() {
  const { t } = useTranslation("common");
  const sectionRef = useScrollReveal<HTMLElement>();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>(
      "/api/categories?limit=8&isActive=true"
    )
      .then((res) => {
        if (res.success) setCategories(res.data.slice(0, 8));
      })
      .catch((err) => logger.error("MNCategories: fetch error", err))
      .finally(() => setIsLoading(false));
  }, []);

  if (!isLoading && categories.length === 0) return null;

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-40 ${MNPX}`}
      style={{ backgroundColor: MN.bg }}
    >
      <div className="max-w-5xl mx-auto text-center">
        {/* Section header */}
        <div className="mb-12 reveal">
          <p
            className="text-[11px] tracking-[0.25em] uppercase mb-6"
            style={{ color: MN.muted }}
          >
            {t("vitrine.mnCategories.tagline", { defaultValue: "Browse by" })}
          </p>
        </div>

        {/* Category links */}
        <div className="flex flex-wrap items-center justify-center gap-y-4 reveal-stagger">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center">
                  <MNCategorySkeleton />
                  {i < 5 && (
                    <span
                      className="mx-4 md:mx-6 w-px h-4 inline-block"
                      style={{ backgroundColor: MN.border }}
                    />
                  )}
                </div>
              ))
            : categories.map((cat, i) => (
                <div key={cat.id || cat.slug} className="flex items-center">
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="text-sm md:text-base font-light tracking-tight transition-opacity hover:opacity-50"
                    style={{ color: MN.text }}
                  >
                    {cat.name}
                  </Link>
                  {i < categories.length - 1 && (
                    <span
                      className="mx-4 md:mx-6 w-px h-4 inline-block"
                      style={{ backgroundColor: MN.border }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              ))}
        </div>

        {/* Subtle "View all" link */}
        <div className="mt-10 reveal">
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 text-xs tracking-widest uppercase underline underline-offset-4 decoration-1 transition-opacity hover:opacity-60"
            style={{ color: MN.muted }}
          >
            {t("vitrine.mnCategories.viewAll", {
              defaultValue: "All Categories",
            })}
            <ArrowRight className="h-3 w-3" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SECTION 5 — NEWSLETTER
   Single-line: "Subscribe" + inline input with thin bottom border + arrow
   ══════════════════════════════════════════════════════════════════ */

export function MNNewsletter() {
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
        body: JSON.stringify({ email, source: "homepage" }),
        headers: { "Content-Type": "application/json" },
      });
      setStatus("success");
      setEmail("");
    } catch (err) {
      logger.error("MNNewsletter: subscribe error", err);
      setStatus("error");
    }
  };

  return (
    <section
      ref={sectionRef}
      className={`py-24 md:py-40 ${MNPX}`}
      style={{ backgroundColor: MN.bgAlt }}
    >
      <div className="max-w-2xl mx-auto reveal">
        {status === "success" ? (
          <div className="text-center">
            <p
              className="text-sm font-light"
              style={{ color: MN.text }}
            >
              {t("vitrine.mnNewsletter.success", {
                defaultValue: "Thank you. You are now subscribed.",
              })}
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row items-start sm:items-end gap-6 sm:gap-8"
          >
            {/* Label */}
            <h2
              className="text-xl md:text-2xl font-extralight tracking-tight whitespace-nowrap shrink-0"
              style={{ color: MN.text }}
            >
              {t("vitrine.mnNewsletter.heading", { defaultValue: "Subscribe" })}
            </h2>

            {/* Input — thin bottom border only, no box */}
            <div className="flex-1 w-full sm:w-auto flex items-end gap-3">
              <div className="flex-1 relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("vitrine.mnNewsletter.placeholder", {
                    defaultValue: "Your email address",
                  })}
                  className="w-full bg-transparent border-0 border-b py-2 text-sm font-light focus:outline-none transition-colors placeholder:font-light"
                  style={{
                    borderBottomWidth: "1px",
                    borderBottomColor: MN.border,
                    color: MN.text,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderBottomColor = MN.text;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderBottomColor = MN.border;
                  }}
                  required
                  aria-label={t("vitrine.mnNewsletter.emailLabel", {
                    defaultValue: "Email address",
                  })}
                />
              </div>

              {/* Arrow submit button */}
              <button
                type="submit"
                disabled={status === "loading"}
                className="p-2 transition-opacity hover:opacity-60 disabled:opacity-30 shrink-0"
                style={{ color: MN.text }}
                aria-label={t("vitrine.mnNewsletter.submit", {
                  defaultValue: "Subscribe",
                })}
              >
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </form>
        )}

        {status === "error" && (
          <p
            className="text-xs mt-4 font-light"
            style={{ color: MN.muted }}
          >
            {t("vitrine.mnNewsletter.error", {
              defaultValue: "Something went wrong. Please try again.",
            })}
          </p>
        )}
      </div>
    </section>
  );
}
