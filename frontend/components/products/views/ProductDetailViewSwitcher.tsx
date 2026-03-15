"use client";

import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { resolveTemplate } from "@/lib/resolveTemplate";
import DefaultProductDetailView from "./DefaultProductDetailView";
import type { ProductDetailViewProps } from "@/types";

const BoldView = dynamic(() => import("./BoldProductDetailView"));
const ElegantView = dynamic(() => import("./ElegantProductDetailView"));
const ZenView = dynamic(() => import("./ZenProductDetailView"));
const PlayfulView = dynamic(() => import("./PlayfulProductDetailView"));
const TechView = dynamic(() => import("./TechProductDetailView"));
const ArtisanView = dynamic(() => import("./ArtisanProductDetailView"));
const MagazineView = dynamic(() => import("./MagazineProductDetailView"));

const VIEW_MAP: Record<string, React.ComponentType<ProductDetailViewProps>> = {
  bold: BoldView,
  elegant: ElegantView,
  zen: ZenView,
  minimal: ZenView,
  playful: PlayfulView,
  tech: TechView,
  artisan: ArtisanView,
  magazine: MagazineView,
};

export function ProductDetailViewSwitcher(props: ProductDetailViewProps) {
  const { settings } = useSettings();
  const themeId = resolveTemplate(settings?.homepage);
  const View = VIEW_MAP[themeId] || DefaultProductDetailView;
  return <View {...props} />;
}
