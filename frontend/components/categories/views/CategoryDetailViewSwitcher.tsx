"use client";

import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { resolveTemplate } from "@/lib/resolveTemplate";
import DefaultCategoryDetailView from "./DefaultCategoryDetailView";
import type { CategoryDetailViewProps } from "@/types";

const BoldView = dynamic(() => import("./BoldCategoryDetailView"));
const ElegantView = dynamic(() => import("./ElegantCategoryDetailView"));
const ZenView = dynamic(() => import("./ZenCategoryDetailView"));
const PlayfulView = dynamic(() => import("./PlayfulCategoryDetailView"));
const TechView = dynamic(() => import("./TechCategoryDetailView"));
const ArtisanView = dynamic(() => import("./ArtisanCategoryDetailView"));
const MagazineView = dynamic(() => import("./MagazineCategoryDetailView"));

const VIEW_MAP: Record<string, React.ComponentType<CategoryDetailViewProps>> = {
  bold: BoldView,
  elegant: ElegantView,
  zen: ZenView,
  minimal: ZenView,
  playful: PlayfulView,
  tech: TechView,
  artisan: ArtisanView,
  magazine: MagazineView,
};

export function CategoryDetailViewSwitcher(props: CategoryDetailViewProps) {
  const { settings } = useSettings();
  const themeId = resolveTemplate(settings?.homepage);
  const View = VIEW_MAP[themeId] || DefaultCategoryDetailView;
  return <View {...props} />;
}
