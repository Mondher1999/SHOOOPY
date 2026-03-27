"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import {
  Truck,
  RotateCcw,
  Store,
  ShieldCheck,
  Search,
  User,
  ShoppingCart,
  Menu,
  X,
  Phone,
  Mail,
  MapPin,
  ArrowRight,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Flame,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useShowcase } from "@/hooks/useShowcase";
import { useToast } from "@/hooks/use-toast";
import { SearchBar } from "@/components/layout/SearchBar";
import { fetchAPI } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/contexts/SettingsContext";
import { useFormatPrice } from "@/hooks/useFormatPrice";
import { buildSocialLinks } from "@/lib/social-icons";
import logger from "@/lib/logger";
import type { Product, Category, CategoryNode } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001";

/* ──────────────────────────── PALETTE ──────────────────────────── */
const C = {
  grey: "#2C3E50",
  orange: "#FF6A00",
  white: "#FFFFFF",
  lightGrey: "#F5F5F5",
  medGrey: "#E8E8E8",
  textMuted: "#5A6A7A",
} as const;

/** Shared horizontal padding — keeps logo, nav, hero, and all sections aligned */
const PX = "px-6 md:px-16 lg:px-28 xl:px-40";

/* ──────────────────────────── STATIC DATA ───────────────────────── */

const GALLERY_IMAGES = [
  "/images/homepage/gallery/gallery-1.jpg",
  "/images/homepage/gallery/gallery-2.jpg",
  "/images/homepage/gallery/gallery-3.jpg",
  "/images/homepage/gallery/gallery-4.jpg",
  "/images/homepage/gallery/gallery-5.jpg",
  "/images/homepage/gallery/gallery-6.jpg",
  "/images/homepage/gallery/gallery-7.jpg",
  "/images/homepage/gallery/gallery-8.png",
];

const PARTNERS = [
  { name: "Ivar", img: "/images/homepage/partners/partner-1.png" },
  { name: "JIFI", img: "/images/homepage/partners/partner-2.png" },
  { name: "mDis", img: "/images/homepage/partners/partner-3.png" },
  { name: "Jascom", img: "/images/homepage/partners/partner-4.png" },
  { name: "Noda", img: "/images/homepage/partners/partner-5.png" },
  { name: "Energizer", img: "/images/homepage/partners/energizer.png" },
  { name: "SanDisk", img: "/images/homepage/partners/sandisk.svg" },
  { name: "Format", img: "/images/homepage/partners/format.png" },
];

const TRUST_ICONS = [Truck, RotateCcw, Store, ShieldCheck];
const TRUST_KEYS = [
  { title: "vitrine.trust.freeShipping", desc: "vitrine.trust.freeShippingDesc" },
  { title: "vitrine.trust.returns", desc: "vitrine.trust.returnsDesc" },
  { title: "vitrine.trust.cod", desc: "vitrine.trust.codDesc" },
  { title: "vitrine.trust.trusted", desc: "vitrine.trust.trustedDesc" },
];

/* ──────────────────────────── HELPERS ────────────────────────────── */

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

function StarRating({ average, count }: { average: number; count: number }) {
  return (
    <div className="flex items-center gap-1">
      <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
      <span className="text-xs" style={{ color: C.textMuted }}>
        {average.toFixed(1)}
        {count > 0 && <span className="ml-0.5">({count})</span>}
      </span>
    </div>
  );
}

/* ──────────────────────────── PRODUCT CARD ───────────────────────── */

interface ProductCardInlineProps {
  product: Product;
  badge?: string | null;
  isShowcase: boolean;
  onAddToCart: (product: Product) => void;
  addToCartLabel: string;
  viewProductLabel: string;
}

function ProductCardInline({ product, badge, isShowcase, viewProductLabel }: ProductCardInlineProps) {
  const formatPrice = useFormatPrice();
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.compareAtPrice! - product.price) / product.compareAtPrice!) * 100)
    : 0;
  const displayBadge = badge || (hasDiscount ? `-${discountPercent}%` : null);
  const inStock = product.stock > 0;

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-200 transition-all hover:shadow-xl hover:-translate-y-1 cursor-pointer"
    >
      {/* Image area — clean white bg, centered product, matches store cards */}
      <div className="relative aspect-square overflow-hidden bg-white rounded-t-2xl">
        <Image
          src={getProductImage(product, "medium")}
          alt={product.name}
          fill
          className="object-contain p-6 group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
        />
        {displayBadge && (
          <span
            className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold text-white"
            style={{ backgroundColor: C.grey }}
          >
            {displayBadge}
          </span>
        )}
        {!inStock && (
          <span className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-xs font-bold text-white bg-gray-500">
            Rupture de stock
          </span>
        )}
      </div>
      {/* Info area */}
      <div className="flex flex-col flex-1 px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6">
        {/* Price line first — like CameraStuff */}
        {!isShowcase && (
          <div className="flex items-center gap-2.5 mb-2">
            <p className="text-base font-semibold" style={{ color: C.grey }}>
              {formatPrice(product.price)}
            </p>
            {hasDiscount && (
              <p className="text-sm line-through" style={{ color: C.textMuted }}>
                {formatPrice(product.compareAtPrice!)}
              </p>
            )}
          </div>
        )}
        {/* Product name */}
        <h3 className="text-sm md:text-base font-medium leading-snug line-clamp-2 min-h-[2.75rem] mb-4" style={{ color: C.grey }}>
          {product.name}
        </h3>
        {/* Spacer */}
        <div className="flex-1" />
        {/* View product button — bordered, rounded-full, like CameraStuff */}
        <button
          type="button"
          className="w-full py-3 rounded-full text-sm font-medium border-2 transition-all duration-200"
          style={{ borderColor: "#D1D5DB", color: C.grey }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = C.orange;
            e.currentTarget.style.borderColor = C.orange;
            e.currentTarget.style.color = C.white;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.borderColor = "#D1D5DB";
            e.currentTarget.style.color = C.grey;
          }}
        >
          {viewProductLabel}
        </button>
      </div>
    </Link>
  );
}

/* ──────────────────────────── SKELETON CARDS ─────────────────────── */

function ProductSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200">
      <Skeleton className="aspect-square w-full" />
      <div className="px-5 pt-4 pb-5 md:px-6 md:pt-5 md:pb-6 space-y-3">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-12 w-full rounded-full mt-2" />
      </div>
    </div>
  );
}

function CategorySkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden border border-gray-100">
      <Skeleton className="aspect-square w-full" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-2/3 mx-auto" />
        <Skeleton className="h-3 w-1/2 mx-auto" />
        <Skeleton className="h-3 w-1/3 mx-auto" />
      </div>
    </div>
  );
}

/* ──────────────────────────── COMPONENTS ───────────────────────── */

/* ─── HEADER (CameraStuff style) ─── */
function HCHeader() {
  const { t } = useTranslation("common");
  const isShowcase = useShowcase();
  const { user } = useAuth();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: CategoryNode[] }>("/api/categories/tree")
      .then((res) => {
        if (res.success) {
          setCategories(res.data.filter((c) => c.isActive).slice(0, 8));
        }
      })
      .catch((err) => logger.error("HCHeader: failed to fetch categories", err));
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const VISIBLE_CATS = 4;
  const visibleCats = categories.slice(0, VISIBLE_CATS);
  const overflowCats = categories.slice(VISIBLE_CATS);

  const navLinks: { label: string; href: string; highlight?: boolean; children?: CategoryNode[] }[] = [
    { label: t("nav.allProducts"), href: "/products" },
    { label: t("nav.newArrivals"), href: "/products?sort=newest" },
    ...visibleCats.map((c) => ({
      label: c.name,
      href: `/categories/${c.slug}`,
      children: c.children?.filter((sub) => sub.isActive) ?? [],
    })),
    ...(overflowCats.length > 0
      ? [{ label: t("nav.more"), href: "#more", children: overflowCats as CategoryNode[] }]
      : []),
    { label: t("nav.sale"), href: "/products?sale=true", highlight: true },
  ];

  return (
    <header
      className="sticky top-0 z-50 bg-white transition-shadow duration-300"
      style={{ boxShadow: scrolled ? "0 1px 8px rgba(0,0,0,0.06)" : "none" }}
    >
      {/* ── Row 1: Main header — Logo | Search | Account | Cart ── */}
      <div className="flex items-center gap-5 px-10 md:px-24 lg:px-40 xl:px-56 py-5 md:py-7">
        {/* Mobile menu toggle */}
        <button
          type="button"
          className="lg:hidden p-2 -ml-1 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
        >
          {mobileOpen ? <X className="w-5 h-5" style={{ color: C.grey }} /> : <Menu className="w-5 h-5" style={{ color: C.grey }} />}
        </button>

        {/* Logo — crisp SVG Ω + styled text, horizontal like CameraStuff */}
        <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 cursor-pointer">
          {/* Inline SVG omega — vector, always crisp */}
          <svg viewBox="0 0 200 200" className="h-9 md:h-10 w-auto flex-shrink-0" aria-hidden="true">
            <path d="M40 170V150h25C45 135 30 110 30 82c0-37 30-67 70-67s70 30 70 67c0 28-15 53-35 68h25v20h-50v-20h10c15-12 25-38 25-68 0-24-20-44-45-44S55 58 55 82c0 30 10 56 25 68h10v20H40z" fill="#FF6A00"/>
          </svg>
          <div className="hidden sm:flex items-baseline gap-0.5">
            <span className="text-2xl md:text-[28px] font-bold italic" style={{ color: C.orange }}>Omega</span>
            <span className="text-2xl md:text-[28px] font-light italic" style={{ color: C.grey }}>Distribution</span>
          </div>
        </Link>

        {/* Desktop search */}
        <div className="hidden md:flex flex-1 max-w-xl lg:max-w-3xl mx-8 lg:mx-14">
          <SearchBar className="w-full" />
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-3 ml-auto flex-shrink-0">
          {/* Mobile search toggle */}
          <button
            type="button"
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors cursor-pointer"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-label={t("search.ariaLabel")}
          >
            <Search className="w-5 h-5" style={{ color: C.grey }} />
          </button>

          {/* Account — outlined pill, thin border (CameraStuff exact match) */}
          <Link
            href={user ? "/dashboard/profile" : "/auth/login"}
            className="hidden md:flex items-center gap-2.5 px-6 py-3 rounded-full border border-gray-300 text-sm font-medium transition-all hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
            style={{ color: C.grey }}
          >
            <User className="w-[18px] h-[18px]" />
            <span>{t("nav.account")}</span>
          </Link>

          {/* Cart — dark pill (CameraStuff exact match: very dark bg, white text, inline count) */}
          {!isShowcase && (
            <Link
              href="/cart"
              className="flex items-center gap-2.5 px-6 py-3 rounded-full text-white text-sm font-medium transition-all hover:opacity-90 cursor-pointer"
              style={{ backgroundColor: "#1a1a2e" }}
            >
              <ShoppingCart className="w-[18px] h-[18px]" />
              <span className="hidden sm:inline">{t("nav.cart")} ({totalItems})</span>
            </Link>
          )}
        </div>
      </div>

      {/* Mobile search bar */}
      {searchOpen && (
        <div className="md:hidden px-4 pb-3">
          <SearchBar className="w-full" />
        </div>
      )}

      {/* ── Row 2: Navigation bar — white bg, border top/bottom (CameraStuff exact match) ── */}
      <nav className="hidden lg:flex items-center justify-between border-t border-b border-gray-200 px-10 md:px-24 lg:px-40 xl:px-56">
        {/* Left — nav links */}
        <div className="flex items-center">
          {navLinks.map((link) => {
            const hasSubs = link.children && link.children.length > 0;
            const isOpen = openDropdown === link.href;
            return (
              <div
                key={link.href + link.label}
                className="relative group/nav"
                onMouseEnter={() => hasSubs && setOpenDropdown(link.href)}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link
                  href={link.href}
                  className="relative flex items-center gap-1 px-3.5 lg:px-4 py-4 text-[14px] font-medium transition-colors duration-200 cursor-pointer whitespace-nowrap"
                  style={{ color: link.highlight ? C.orange : isOpen ? C.orange : C.grey }}
                >
                  {link.highlight ? (
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4" />
                      {link.label}
                    </span>
                  ) : (
                    link.label
                  )}
                  {hasSubs && (
                    <ChevronDown
                      className="w-3.5 h-3.5 transition-transform duration-200"
                      style={{ color: isOpen ? C.orange : "#9CA3AF", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}
                    />
                  )}
                  {/* Animated underline — shows on hover or open dropdown */}
                  <span
                    className="absolute bottom-0 left-3.5 right-3.5 lg:left-4 lg:right-4 h-[2px] transition-transform duration-200 ease-out origin-left group-hover/nav:scale-x-100"
                    style={{
                      backgroundColor: C.orange,
                      transform: isOpen ? "scaleX(1)" : "scaleX(0)",
                    }}
                  />
                </Link>

                {/* Subcategory dropdown — animated */}
                {hasSubs && (
                  <div
                    className="absolute top-full left-0 bg-white border border-gray-200 shadow-xl rounded-b-xl min-w-[280px] py-3 z-50 transition-all duration-200 ease-out origin-top"
                    style={{
                      opacity: isOpen ? 1 : 0,
                      transform: isOpen ? "scaleY(1) translateY(0)" : "scaleY(0.95) translateY(-4px)",
                      pointerEvents: isOpen ? "auto" : "none",
                    }}
                  >
                    {link.children!.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categories/${sub.slug}`}
                        className="group/sub flex items-center justify-between px-6 py-3 text-sm text-gray-600 hover:bg-gray-50 transition-colors duration-150 cursor-pointer"
                      >
                        <span className="group-hover/sub:text-gray-900 transition-colors duration-150">{sub.name}</span>
                        {sub.children && sub.children.length > 0 && (
                          <ChevronRight className="w-3.5 h-3.5 text-gray-400 group-hover/sub:text-gray-600 transition-colors duration-150" />
                        )}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Right — delivery info */}
        <div className="flex items-center gap-2.5 cursor-pointer hover:opacity-80 transition-opacity pl-6 flex-shrink-0 whitespace-nowrap">
          <Truck className="w-5 h-5 flex-shrink-0" style={{ color: C.grey }} />
          <div className="flex flex-col leading-tight">
            <span className="text-xs" style={{ color: C.textMuted }}>{t("nav.needDelivery")}</span>
            <span className="text-[13px] font-semibold" style={{ color: C.grey }}>{t("nav.seeEstimates")}</span>
          </div>
        </div>
      </nav>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <nav className="lg:hidden border-b border-gray-200 bg-white max-h-[70vh] overflow-y-auto" style={{ boxShadow: "0 4px 12px rgba(0,0,0,0.05)" }}>
          <div className="flex flex-col">
            {navLinks.map((link) => (
              <div key={link.href + link.label}>
                <Link
                  href={link.href}
                  className="flex items-center justify-between px-5 py-3.5 text-sm font-medium border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                  style={{ color: link.highlight ? C.orange : C.grey }}
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    {link.highlight && <Flame className="w-4 h-4" />}
                    {link.label}
                  </span>
                  {link.children && link.children.length > 0 ? (
                    <ChevronDown className="w-4 h-4 text-gray-300" />
                  ) : (
                    <ArrowRight className="w-4 h-4 text-gray-300" />
                  )}
                </Link>
                {/* Mobile subcategories */}
                {link.children && link.children.length > 0 && (
                  <div className="bg-gray-50/50">
                    {link.children.map((sub) => (
                      <Link
                        key={sub.id}
                        href={`/categories/${sub.slug}`}
                        className="flex items-center justify-between pl-10 pr-5 py-2.5 text-sm text-gray-500 border-b border-gray-100 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-pointer"
                        onClick={() => setMobileOpen(false)}
                      >
                        {sub.name}
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300" />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {/* Delivery info */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-t border-gray-200">
              <Truck className="w-5 h-5" style={{ color: C.grey }} />
              <div className="flex flex-col leading-tight">
                <span className="text-xs" style={{ color: C.textMuted }}>{t("nav.needDelivery")}</span>
                <span className="text-sm font-semibold" style={{ color: C.grey }}>{t("nav.seeEstimates")}</span>
              </div>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}

/* ─── HERO BANNER (rounded card with margins, CameraStuff style) ─── */
export function HCHero() {
  const { t } = useTranslation("common");

  return (
    <section className="pt-6 md:pt-8 pb-2 px-10 md:px-24 lg:px-40 xl:px-56">
      <div
        className="relative w-full overflow-hidden rounded-2xl md:rounded-3xl"
        style={{ height: "min(65vh, 500px)" }}
      >
        <Image
          src="/images/homepage/banners/hero.jpg"
          alt={t("appName")}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 90vw"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
        <div className="relative z-10 flex flex-col items-start justify-center h-full px-10 md:px-16 lg:px-24 max-w-3xl">
          <span className="text-xs md:text-sm uppercase tracking-widest text-white/80 mb-3">
            {t("vitrine.hero.subtitle")}
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4">
            {t("vitrine.hero.titleLine1")}
            <br />
            <span style={{ color: C.orange }}>{t("vitrine.hero.titleLine2")}</span>
          </h1>
          <p className="text-white/80 text-sm md:text-base mb-6 max-w-lg">
            {t("vitrine.hero.description")}
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-semibold text-sm transition-all hover:opacity-90 hover:translate-x-1 cursor-pointer"
            style={{ backgroundColor: C.orange }}
          >
            {t("vitrine.hero.cta")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ─── TRUST BADGES ─── */
export function HCTrustBadges() {
  const { t } = useTranslation("common");

  return (
    <section className={`bg-white py-12 md:py-18 ${PX}`}>
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-7">
          {TRUST_KEYS.map((badge, i) => {
            const Icon = TRUST_ICONS[i];
            return (
              <div key={badge.title} className="flex flex-col items-center text-center">
                <div className="mb-4">
                  <Icon
                    className="w-12 h-12 md:w-14 md:h-14"
                    style={{ color: C.orange }}
                    strokeWidth={1}
                    aria-hidden="true"
                  />
                </div>
                <h3 className="text-sm md:text-base font-semibold mb-1.5" style={{ color: C.grey }}>
                  {t(badge.title)}
                </h3>
                <p className="text-xs md:text-sm leading-relaxed max-w-[270px]" style={{ color: C.textMuted }}>
                  {t(badge.desc)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ─── SEO HEADLINE ─── */
export function HCSEOHeadline() {
  const { t } = useTranslation("common");

  return (
    <section className={`bg-white py-16 md:py-20 ${PX}`}>
      <div className="max-w-[1300px] mx-auto text-center">
        <p className="text-2xl md:text-3xl max-w-3xl mx-auto leading-relaxed font-medium" style={{ color: C.grey }}>
          {t("vitrine.seoHeadline", { appName: t("appName") })}
        </p>
      </div>
    </section>
  );
}

/* ─── TRENDING CATEGORIES (DYNAMIC) ─── */
export function HCTrendingCategories() {
  const { t } = useTranslation("common");
  const [parents, setParents] = useState<Category[]>([]);
  const [subMap, setSubMap] = useState<Record<string, Category[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>("/api/categories")
      .then((res) => {
        if (res.success) {
          const all = res.data.filter((c) => c.isActive);
          const topLevel = all.filter((c) => !c.parent).slice(0, 8);
          const topIds = new Set(topLevel.map((c) => c.id));
          // Group subcategories by parent id
          const map: Record<string, Category[]> = {};
          all.forEach((c) => {
            if (!c.parent) return;
            const pid = typeof c.parent === "string" ? c.parent : (c.parent as Category).id;
            if (topIds.has(pid)) {
              if (!map[pid]) map[pid] = [];
              map[pid].push(c);
            }
          });
          setParents(topLevel);
          setSubMap(map);
        }
      })
      .catch((err) => logger.error("HCTrendingCategories: fetch error", err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className={`py-14 md:py-20 ${PX}`} style={{ backgroundColor: C.lightGrey }}>
      <div className="max-w-[1300px] mx-auto">
        {/* Section header — centered, single line like CameraStuff */}
        <h2 className="text-center text-lg md:text-xl font-normal mb-10 md:mb-14" style={{ color: C.grey }}>
          {t("vitrine.categories.title")}
        </h2>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 md:gap-7">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex flex-col">
                  <Skeleton className="aspect-[4/5] w-full rounded-2xl" />
                  <div className="flex flex-col items-center pt-5 gap-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-10 w-32 rounded-full mt-1" />
                  </div>
                </div>
              ))
            : parents.map((cat) => {
                const subs = subMap[cat.id] ?? [];
                const subLabel = subs.slice(0, 3).map((s) => s.name).join(", ");
                return (
                  <Link
                    key={cat.id}
                    href={`/categories/${cat.slug}`}
                    className="group flex flex-col cursor-pointer"
                  >
                    {/* Image — tall rectangle, rounded, subtle zoom */}
                    <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100">
                      <Image
                        src={getCategoryImage(cat)}
                        alt={cat.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                        sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                      />
                    </div>
                    {/* Text below image — centered, consistent height */}
                    <div className="flex flex-col items-center text-center pt-5 px-2 flex-1">
                      <h3 className="text-base md:text-lg font-semibold leading-snug line-clamp-2 mb-1" style={{ color: C.grey }}>
                        {cat.name}
                      </h3>
                      <p className="text-xs md:text-sm leading-relaxed line-clamp-1 mb-3" style={{ color: C.textMuted, visibility: subLabel ? "visible" : "hidden" }}>
                        {subLabel || "\u00A0"}
                      </p>
                      {/* Compact dark button — always aligned at bottom */}
                      <span
                        className="inline-block mt-auto px-7 py-2.5 rounded-full text-sm font-medium text-white transition-all duration-200 group-hover:opacity-80"
                        style={{ backgroundColor: C.grey }}
                      >
                        {t("vitrine.categories.shopNow")}
                      </span>
                    </div>
                  </Link>
                );
              })}
        </div>
      </div>
    </section>
  );
}

/* ─── WELCOME / ABOUT ─── */
export function HCWelcome() {
  const { t } = useTranslation("common");
  const appName = t("appName");

  return (
    <section className={`bg-white py-14 md:py-20 ${PX}`}>
      <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row rounded-2xl overflow-hidden border border-gray-200">
        {/* Left — text */}
        <div className="w-full md:w-1/2 flex items-center bg-white">
          <div className="px-10 py-12 md:px-14 lg:px-16">
            <h2 className="text-lg md:text-xl lg:text-2xl font-semibold mb-4 leading-snug whitespace-nowrap" style={{ color: C.grey }}>
              {t("vitrine.welcome.title", { appName })}
            </h2>
            <p className="text-xs md:text-sm leading-[1.8] mb-3" style={{ color: C.textMuted }}>
              {t("vitrine.welcome.paragraph1", { appName })}
            </p>
            <p className="text-xs md:text-sm leading-[1.8] mb-6" style={{ color: C.textMuted }}>
              {t("vitrine.welcome.paragraph2", { appName })}
            </p>
            <Link
              href="/products"
              className="inline-block text-white rounded-full px-6 py-2.5 text-xs md:text-sm font-medium hover:opacity-90 transition-opacity cursor-pointer"
              style={{ backgroundColor: C.grey }}
            >
              {t("vitrine.welcome.cta", { appName })}
            </Link>
          </div>
        </div>
        {/* Right — image */}
        <div className="w-full md:w-1/2 min-h-[320px] md:min-h-[440px] relative overflow-hidden">
          <Image
            src="/images/homepage/gallery/gallery-1.jpg"
            alt={t("vitrine.welcome.title", { appName })}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      </div>
    </section>
  );
}

/* ─── ABOUT US — Founded + Presence + Clients in 3 cards ─── */
export function HCAboutUs() {
  const { t } = useTranslation("common");

  return (
    <section className={`py-14 md:py-20 ${PX}`} style={{ backgroundColor: C.lightGrey }}>
      <div className="max-w-[1300px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-7">
          {/* Card 1 — Founded */}
          <div className="rounded-2xl border border-gray-200 overflow-hidden flex flex-col">
            <div className="px-8 py-6 flex items-center justify-center" style={{ backgroundColor: C.orange }}>
              <span className="text-2xl md:text-3xl font-bold text-white whitespace-nowrap">
                {t("vitrine.founded.year")}
              </span>
            </div>
            <div className="px-7 py-7 flex-1">
              <h3 className="text-base md:text-lg font-semibold mb-3" style={{ color: C.grey }}>
                {t("vitrine.founded.heading")}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
                {t("vitrine.founded.paragraph")}
              </p>
            </div>
          </div>

          {/* Card 2 — Presence */}
          <div className="rounded-2xl border border-gray-200 px-7 py-7 flex flex-col">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center mb-5"
              style={{ backgroundColor: `${C.orange}12` }}
            >
              <Truck className="w-6 h-6" style={{ color: C.orange }} />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-3" style={{ color: C.grey }}>
              {t("vitrine.presence.heading")}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
              {t("vitrine.presence.paragraph1")}
            </p>
          </div>

          {/* Card 3 — Clients */}
          <div className="rounded-2xl border border-gray-200 px-7 py-7 flex flex-col items-center text-center">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center mb-5"
              style={{ backgroundColor: `${C.orange}12` }}
            >
              <Store className="w-6 h-6" style={{ color: C.orange }} />
            </div>
            <h3 className="text-base md:text-lg font-semibold mb-3" style={{ color: C.grey }}>
              {t("vitrine.clients.heading")}
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: C.textMuted }}>
              {t("vitrine.clients.paragraph")}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── GALLERY GRID ─── */
export function HCGallery() {
  const { t } = useTranslation("common");

  return (
    <section className={`py-16 md:py-24 ${PX} bg-white`}>
      <div className="max-w-[1300px] mx-auto">
        <h2 className="text-xl md:text-2xl font-semibold text-center mb-12" style={{ color: C.grey }}>
          {t("vitrine.gallery.title")}
        </h2>
        <div className="grid grid-cols-3 md:grid-cols-4 gap-2 md:gap-3">
          {GALLERY_IMAGES.map((img, i) => (
            <div
              key={i}
              className={`relative overflow-hidden rounded-xl group ${i === 0 ? "col-span-2 row-span-2" : ""}`}
              style={{ aspectRatio: "1/1" }}
            >
              <Image
                src={img}
                alt={t("vitrine.gallery.imageAlt", { index: String(i + 1) })}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-500"
                sizes={i === 0 ? "(max-width: 768px) 66vw, 50vw" : "(max-width: 768px) 33vw, 25vw"}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── TOP SELLING PRODUCTS (DYNAMIC) ─── */
export function HCTopSelling() {
  const { t } = useTranslation("common");
  const { t: tCart } = useTranslation("cart");
  const { addItem, openDrawer } = useCart();
  const isShowcase = useShowcase();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>("/api/products?sort=bestseller&limit=4")
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("HCTopSelling: fetch error", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product.id, 1);
      toast({ description: tCart("addedToCartDesc", { name: product.name }) });
      openDrawer();
    } catch (err) {
      logger.error("HCTopSelling addToCart error:", err);
      toast({ title: tCart("errorAdding"), variant: "destructive" });
    }
  };

  return (
    <section className={`py-16 md:py-24 ${PX} bg-white`}>
      <div className="max-w-[1300px] mx-auto">
        <div className="flex items-start justify-between mb-10 md:mb-14">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold leading-snug" style={{ color: C.grey }}>
              {t("vitrine.topSelling.title")}
            </h2>
            <p className="text-sm md:text-base mt-1" style={{ color: C.textMuted }}>
              {t("vitrine.topSelling.subtitle")}
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm underline cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap ml-4 mt-0.5"
            style={{ color: C.grey }}
          >
            {t("vitrine.topSelling.viewAll")}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map((product) => (
                <ProductCardInline
                  key={product.id}
                  product={product}
                  isShowcase={isShowcase}
                  onAddToCart={handleAddToCart}
                  addToCartLabel={t("vitrine.topSelling.addToCart")}
                  viewProductLabel={t("vitrine.topSelling.viewProduct")}
                />
              ))}
        </div>
      </div>
    </section>
  );
}

/* ─── PROMO FULL-WIDTH BANNER ─── */
export function HCPromoBanner() {
  const { t } = useTranslation("common");

  return (
    <section className={`bg-white py-8 md:py-12 ${PX}`}>
      <div className="max-w-[1300px] mx-auto">
      <div
        className="relative rounded-2xl overflow-hidden py-12 md:py-16"
        style={{
          background: `linear-gradient(135deg, ${C.grey} 0%, #1a2a3a 40%, ${C.orange} 100%)`,
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center px-6 text-center">
          <svg viewBox="0 0 200 200" className="h-10 w-auto mb-4" aria-hidden="true">
            <path d="M40 170V150h25C45 135 30 110 30 82c0-37 30-67 70-67s70 30 70 67c0 28-15 53-35 68h25v20h-50v-20h10c15-12 25-38 25-68 0-24-20-44-45-44S55 58 55 82c0 30 10 56 25 68h10v20H40z" fill="white"/>
          </svg>
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-2">
            {t("vitrine.promo.title")}
          </h2>
          <p className="text-sm md:text-base text-white/80 mb-5">
            {t("vitrine.promo.subtitle")}
          </p>
          <Link
            href="/categories/paper"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-sm transition-all hover:opacity-90"
            style={{ backgroundColor: C.orange, color: C.white }}
          >
            {t("vitrine.promo.cta")} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
      </div>
    </section>
  );
}

/* ─── WHAT'S NEW (DYNAMIC) ─── */
export function HCNewArrivals() {
  const { t } = useTranslation("common");
  const { t: tCart } = useTranslation("cart");
  const { addItem, openDrawer } = useCart();
  const isShowcase = useShowcase();
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAPI<{ success: boolean; data: { products: Product[] } }>("/api/products?sort=newest&limit=4")
      .then((res) => {
        if (res.success) setProducts(res.data.products);
      })
      .catch((err) => logger.error("HCNewArrivals: fetch error", err))
      .finally(() => setLoading(false));
  }, []);

  const handleAddToCart = async (product: Product) => {
    try {
      await addItem(product.id, 1);
      toast({ description: tCart("addedToCartDesc", { name: product.name }) });
      openDrawer();
    } catch (err) {
      logger.error("HCNewArrivals addToCart error:", err);
      toast({ title: tCart("errorAdding"), variant: "destructive" });
    }
  };

  return (
    <section className={`py-16 md:py-24 ${PX}`} style={{ backgroundColor: C.lightGrey }}>
      <div className="max-w-[1300px] mx-auto">
        <div className="flex items-start justify-between mb-10 md:mb-14">
          <div>
            <h2 className="text-xl md:text-2xl font-semibold leading-snug" style={{ color: C.grey }}>
              {t("vitrine.newArrivals.title")}
            </h2>
            <p className="text-sm md:text-base mt-1" style={{ color: C.textMuted }}>
              {t("vitrine.newArrivals.subtitle")}
            </p>
          </div>
          <Link
            href="/products?sort=newest"
            className="text-sm underline cursor-pointer hover:opacity-70 transition-opacity whitespace-nowrap ml-4 mt-0.5"
            style={{ color: C.grey }}
          >
            {t("vitrine.newArrivals.viewAll")}
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-7">
          {loading
            ? Array.from({ length: 4 }).map((_, i) => <ProductSkeleton key={i} />)
            : products.map((product) => {
                const isNew = new Date(product.createdAt).getTime() > Date.now() - 30 * 24 * 60 * 60 * 1000;
                const badge = isNew ? t("landing.newArrivals.badge") : null;
                return (
                  <ProductCardInline
                    key={product.id}
                    product={product}
                    badge={badge}
                    isShowcase={isShowcase}
                    onAddToCart={handleAddToCart}
                    addToCartLabel={t("vitrine.topSelling.addToCart")}
                    viewProductLabel={t("vitrine.topSelling.viewProduct")}
                  />
                );
              })}
        </div>
      </div>
    </section>
  );
}

/* ─── BRAND SECTION (merged banner + description) ─── */
export function HCBrand() {
  const { t } = useTranslation("common");
  const appName = t("appName");

  return (
    <section className={`py-14 md:py-20 ${PX}`}>
      <div className="max-w-[1300px] mx-auto">
      {/* Label + heading above the card */}
      <div className="text-center mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest mb-2" style={{ color: C.orange }}>
          {t("vitrine.brand.title")}
        </p>
        <h2 className="text-2xl md:text-3xl font-semibold" style={{ color: C.grey }}>
          {t("vitrine.brand.subtitle")}
        </h2>
      </div>
      {/* Peach card */}
      <div className="rounded-2xl px-8 py-12 md:px-16 md:py-16 lg:px-20 lg:py-20" style={{ backgroundColor: "#FFF4EB" }}>
        <div className="max-w-3xl mx-auto text-center">
          <h3 className="text-lg md:text-xl lg:text-2xl font-bold mb-5" style={{ color: C.grey }}>
            {t("vitrine.brandDesc.title")}
          </h3>
          <p className="text-sm md:text-base leading-relaxed mb-4" style={{ color: C.textMuted }}>
            {t("vitrine.brandDesc.paragraph1", { appName })}
          </p>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: C.textMuted }}>
            {t("vitrine.brandDesc.paragraph2", { appName })}
          </p>
        </div>
      </div>
      </div>
    </section>
  );
}

/* ─── PARTNERS BAR ─── */
const PARTNERS_PER_PAGE = 8;

export function HCPartnersBar() {
  const { t } = useTranslation("common");
  const [currentPage, setCurrentPage] = useState(0);

  const totalPages = Math.ceil(PARTNERS.length / PARTNERS_PER_PAGE);
  const visiblePartners = PARTNERS.slice(
    currentPage * PARTNERS_PER_PAGE,
    (currentPage + 1) * PARTNERS_PER_PAGE
  );

  return (
    <section className={`py-14 md:py-20 ${PX}`} style={{ backgroundColor: C.lightGrey }}>
      <div className="max-w-[1300px] mx-auto">
        <h2 className="text-lg md:text-xl font-semibold mb-10 md:mb-12" style={{ color: C.grey }}>
          {t("landing.partners.heading")}
        </h2>

        {/* Partner circles — compact grid, all fit in one row on desktop */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-6 md:gap-8">
          {visiblePartners.map((p) => (
            <div key={p.name} className="flex flex-col items-center gap-3">
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full overflow-hidden flex items-center justify-center bg-white border border-gray-200">
                <Image
                  src={p.img}
                  alt={p.name}
                  width={96}
                  height={96}
                  className="object-contain w-full h-full p-3"
                />
              </div>
              <span className="text-xs md:text-sm" style={{ color: C.grey }}>{p.name}</span>
            </div>
          ))}
        </div>

        {/* Carousel pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 mt-10" role="tablist" aria-label={t("landing.partners.heading")}>
            <button
              onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
              disabled={currentPage === 0}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
              aria-label="Previous"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={1.5} />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i)}
                  role="tab"
                  aria-selected={i === currentPage}
                  className={`rounded-full transition-all duration-300 cursor-pointer ${
                    i === currentPage ? "w-7 h-3 bg-gray-800" : "w-3 h-3 bg-gray-300 hover:bg-gray-400"
                  }`}
                />
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages - 1, currentPage + 1))}
              disabled={currentPage >= totalPages - 1}
              className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-default cursor-pointer transition-colors"
              aria-label="Next"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={1.5} />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

/* ─── FOOTER ─── */
function HCFooter() {
  const { t } = useTranslation("common");
  const { settings } = useSettings();
  const [categories, setCategories] = useState<Category[]>([]);
  const socialLinks = useMemo(
    () => buildSocialLinks(settings?.social as Record<string, string> | undefined),
    [settings?.social]
  );
  const store = settings?.store;

  useEffect(() => {
    fetchAPI<{ success: boolean; data: Category[] }>("/api/categories")
      .then((res) => {
        if (res.success) {
          setCategories(res.data.filter((c) => !c.parent && c.isActive).slice(0, 5));
        }
      })
      .catch((err) => logger.error("HCFooter: failed to fetch categories", err));
  }, []);

  const appName = store?.name || t("appName");

  return (
    <footer style={{ backgroundColor: C.grey, color: C.white }}>
      <div className="max-w-[1300px] mx-auto px-4 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-1">
            <Image
              src="/images/homepage/logo/logo-slogan.png"
              alt={appName}
              width={140}
              height={44}
              className="mb-4 brightness-200 invert"
            />
            <p className="text-sm text-white/60 leading-relaxed mb-4">
              {t("vitrine.footer.description")}
            </p>
            {socialLinks.length > 0 && (
              <div className="flex gap-3">
                {socialLinks.map((link) => (
                  <a
                    key={link.key}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full flex items-center justify-center bg-black/40 hover:bg-[#FF6A00] transition-colors"
                    aria-label={link.label}
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d={link.svg} />
                    </svg>
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t("vitrine.footer.quickLinks")}</h3>
            <ul className="space-y-2.5">
              <li><Link href="/products" className="text-sm text-white/60 hover:text-white transition-colors">{t("nav.allProducts")}</Link></li>
              <li><Link href="/products?sort=newest" className="text-sm text-white/60 hover:text-white transition-colors">{t("nav.newArrivals")}</Link></li>
              <li><Link href="/products?sale=true" className="text-sm text-white/60 hover:text-white transition-colors">{t("vitrine.footer.promotions")}</Link></li>
              <li><Link href="/faq" className="text-sm text-white/60 hover:text-white transition-colors">{t("vitrine.footer.aboutUs")}</Link></li>
              <li><Link href="/contact" className="text-sm text-white/60 hover:text-white transition-colors">{t("landing.footer.contact")}</Link></li>
            </ul>
          </div>

          {/* Dynamic Categories */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t("vitrine.footer.categoriesTitle")}</h3>
            <ul className="space-y-2.5">
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link href={`/categories/${cat.slug}`} className="text-sm text-white/60 hover:text-white transition-colors">
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">{t("vitrine.footer.contactUs")}</h3>
            <ul className="space-y-3">
              {store?.address && (
                <li className="flex items-start gap-3 text-sm text-white/60">
                  <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: C.orange }} />
                  {store.address}
                </li>
              )}
              {store?.contactPhone && (
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <Phone className="w-4 h-4 flex-shrink-0" style={{ color: C.orange }} />
                  <a href={`tel:${store.contactPhone}`} className="hover:text-white transition-colors">
                    {store.contactPhone}
                  </a>
                </li>
              )}
              {store?.contactEmail && (
                <li className="flex items-center gap-3 text-sm text-white/60">
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: C.orange }} />
                  <a href={`mailto:${store.contactEmail}`} className="hover:text-white transition-colors">
                    {store.contactEmail}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/10 py-4 px-4">
        <div className="max-w-[1300px] mx-auto flex flex-col md:flex-row items-center justify-between gap-2 text-xs text-white/40">
          <p>{t("vitrine.footer.copyright", { year: new Date().getFullYear(), appName })}</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-white/70 transition-colors">{t("legal.privacy")}</Link>
            <Link href="/terms" className="hover:text-white/70 transition-colors">{t("legal.terms")}</Link>
            <Link href="/refund-policy" className="hover:text-white/70 transition-colors">{t("legal.returnPolicy")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────── EXPORTS ──────────────────────────── */

/** Header used by HeaderSwitcher in hardcoded mode */
export { HCHeader as HardcodedHeader };

/** Footer used by FooterSwitcher in hardcoded mode */
export { HCFooter as HardcodedFooter };

/** Main homepage body sections (no header/footer — those come from switchers) */
export function HardcodedHomepage() {
  return (
    <>
      {/* 1. HOOK — Hero banner grabs attention */}
      <HCHero />
      {/* 2. TRUST — Immediate reassurance (shipping, returns, warranty) */}
      <HCTrustBadges />
      {/* 3. BROWSE — Categories let users self-select */}
      <HCTrendingCategories />
      {/* 4. SELL — Best sellers = highest conversion section */}
      <HCTopSelling />
      {/* 5. PROMO — Full-width visual break + promotion push */}
      <HCPromoBanner />
      {/* 6. SELL — New arrivals for returning visitors */}
      <HCNewArrivals />
      {/* 7. STORY — Who we are (builds brand trust) */}
      <HCWelcome />
      {/* 8. CREDIBILITY — Founded + Presence + Clients in 3 cards */}
      <HCAboutUs />
      {/* 9. BRAND — Banner + description merged */}
      <HCBrand />
      {/* 11. PARTNERS — Logo bar closes with authority */}
      <HCPartnersBar />
    </>
  );
}
