"use client";

import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { resolveTemplate } from "@/lib/resolveTemplate";
import DefaultProductListView from "./DefaultProductListView";
import type { ProductListViewProps } from "@/types";

const BoldView = dynamic(() => import("./BoldProductListView"));
const ElegantView = dynamic(() => import("./ElegantProductListView"));
const ZenView = dynamic(() => import("./ZenProductListView"));
const PlayfulView = dynamic(() => import("./PlayfulProductListView"));
const TechView = dynamic(() => import("./TechProductListView"));
const ArtisanView = dynamic(() => import("./ArtisanProductListView"));
const MagazineView = dynamic(() => import("./MagazineProductListView"));

const VIEW_MAP: Record<string, React.ComponentType<ProductListViewProps>> = {
  bold: BoldView,
  elegant: ElegantView,
  zen: ZenView,
  minimal: ZenView,
  playful: PlayfulView,
  tech: TechView,
  artisan: ArtisanView,
  magazine: MagazineView,
};

export function ProductListViewSwitcher(props: ProductListViewProps) {
  const { settings } = useSettings();
  const themeId = resolveTemplate(settings?.homepage);
  const View = VIEW_MAP[themeId] || DefaultProductListView;
  return <View {...props} />;
}
