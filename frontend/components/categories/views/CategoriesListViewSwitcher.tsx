"use client";

import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { resolveTemplate } from "@/lib/resolveTemplate";
import DefaultCategoriesListView from "./DefaultCategoriesListView";
import type { CategoriesListViewProps } from "@/types";

const BoldView = dynamic(() => import("./BoldCategoriesListView"));
const ElegantView = dynamic(() => import("./ElegantCategoriesListView"));
const ZenView = dynamic(() => import("./ZenCategoriesListView"));
const PlayfulView = dynamic(() => import("./PlayfulCategoriesListView"));
const TechView = dynamic(() => import("./TechCategoriesListView"));
const ArtisanView = dynamic(() => import("./ArtisanCategoriesListView"));
const MagazineView = dynamic(() => import("./MagazineCategoriesListView"));

const VIEW_MAP: Record<string, React.ComponentType<CategoriesListViewProps>> = {
  bold: BoldView,
  elegant: ElegantView,
  zen: ZenView,
  minimal: ZenView,
  playful: PlayfulView,
  tech: TechView,
  artisan: ArtisanView,
  magazine: MagazineView,
};

export function CategoriesListViewSwitcher(props: CategoriesListViewProps) {
  const { settings } = useSettings();
  const themeId = resolveTemplate(settings?.homepage);
  const View = VIEW_MAP[themeId] || DefaultCategoriesListView;
  return <View {...props} />;
}
