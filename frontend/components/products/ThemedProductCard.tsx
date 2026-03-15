"use client";

import React from "react";
import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { ProductCard, ProductCardSkeleton } from "@/components/products/ProductCard";
import type { Product } from "@/types";

// Lazy-load themed cards — classic (default ProductCard) is always bundled
const BoldProductCard = dynamic(
  () => import("@/components/products/cards/BoldProductCard").then((m) => ({ default: m.BoldProductCard })),
  { loading: () => null }
);
const ElegantProductCard = dynamic(
  () => import("@/components/products/cards/ElegantProductCard").then((m) => ({ default: m.ElegantProductCard })),
  { loading: () => null }
);
const ZenProductCard = dynamic(
  () => import("@/components/products/cards/ZenProductCard").then((m) => ({ default: m.ZenProductCard })),
  { loading: () => null }
);
const PlayfulProductCard = dynamic(
  () => import("@/components/products/cards/PlayfulProductCard").then((m) => ({ default: m.PlayfulProductCard })),
  { loading: () => null }
);
const TechProductCard = dynamic(
  () => import("@/components/products/cards/TechProductCard").then((m) => ({ default: m.TechProductCard })),
  { loading: () => null }
);
const ArtisanProductCard = dynamic(
  () => import("@/components/products/cards/ArtisanProductCard").then((m) => ({ default: m.ArtisanProductCard })),
  { loading: () => null }
);
const MagazineProductCard = dynamic(
  () => import("@/components/products/cards/MagazineProductCard").then((m) => ({ default: m.MagazineProductCard })),
  { loading: () => null }
);

type CardComponent = React.ComponentType<{ product: Product; view?: "grid" | "list"; className?: string }>;

const THEME_CARD_MAP: Record<string, CardComponent> = {
  bold: BoldProductCard,
  elegant: ElegantProductCard,
  minimal: ZenProductCard,
  zen: ZenProductCard,
  playful: PlayfulProductCard,
  tech: TechProductCard,
  artisan: ArtisanProductCard,
  magazine: MagazineProductCard,
};

function resolveTemplate(hp: { template?: string; mode?: string } | undefined): string {
  if (hp?.template) return hp.template;
  if (hp?.mode === "hardcoded") return "classic";
  if (hp?.mode === "dynamic") return "dynamic";
  return "classic";
}

interface ThemedProductCardProps {
  product: Product;
  view?: "grid" | "list";
  className?: string;
}

export const ThemedProductCard = React.memo(function ThemedProductCard({
  product,
  view = "grid",
  className,
}: ThemedProductCardProps) {
  const { settings } = useSettings();
  const themeId = resolveTemplate(settings?.homepage);
  const Card = THEME_CARD_MAP[themeId] || ProductCard;

  return <Card product={product} view={view} className={className} />;
}, (prev, next) => prev.product.id === next.product.id && prev.view === next.view && prev.className === next.className);

export { ProductCardSkeleton as ThemedProductCardSkeleton };
