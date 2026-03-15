"use client";

import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { Header } from "@/components/layout/Header";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { useShowcase } from "@/hooks/useShowcase";
import type { HeaderVariant } from "@/types";

const HeaderMinimal = dynamic(
  () => import("@/components/layout/HeaderMinimal").then((m) => ({ default: m.HeaderMinimal })),
  { loading: () => <Header /> }
);
const HeaderCentered = dynamic(
  () => import("@/components/layout/HeaderCentered").then((m) => ({ default: m.HeaderCentered })),
  { loading: () => <Header /> }
);
const HeaderBold = dynamic(
  () => import("@/components/layout/BoldHeader").then((m) => ({ default: m.BoldHeader })),
  { loading: () => <Header /> }
);
const HeaderElegant = dynamic(
  () => import("@/components/layout/ElegantHeader").then((m) => ({ default: m.ElegantHeader })),
  { loading: () => <Header /> }
);
const HeaderZen = dynamic(
  () => import("@/components/layout/ZenHeader").then((m) => ({ default: m.ZenHeader })),
  { loading: () => <Header /> }
);
const HeaderPlayful = dynamic(
  () => import("@/components/layout/PlayfulHeader").then((m) => ({ default: m.PlayfulHeader })),
  { loading: () => <Header /> }
);
const HeaderTech = dynamic(
  () => import("@/components/layout/TechHeader").then((m) => ({ default: m.TechHeader })),
  { loading: () => <Header /> }
);
const HeaderArtisan = dynamic(
  () => import("@/components/layout/ArtisanHeader").then((m) => ({ default: m.ArtisanHeader })),
  { loading: () => <Header /> }
);
const HeaderMagazine = dynamic(
  () => import("@/components/layout/MagazineHeader").then((m) => ({ default: m.MagazineHeader })),
  { loading: () => <Header /> }
);

const VARIANT_MAP: Record<HeaderVariant, React.ComponentType> = {
  classic: Header,
  minimal: HeaderMinimal,
  centered: HeaderCentered,
  bold: HeaderBold,
  elegant: HeaderElegant,
  zen: HeaderZen,
  playful: HeaderPlayful,
  tech: HeaderTech,
  artisan: HeaderArtisan,
  magazine: HeaderMagazine,
};

const HardcodedHeaderImpl = dynamic(
  () => import("@/components/home/HardcodedHomepage").then((m) => ({ default: m.HardcodedHeader })),
  { loading: () => <Header /> }
);

function HardcodedHeader() {
  return <HardcodedHeaderImpl />;
}

export function HeaderSwitcher() {
  const { settings } = useSettings();
  const isShowcase = useShowcase();
  const h = settings?.header;

  if (h?.enabled === false) return null;

  const Comp =
    h?.mode === "hardcoded"
      ? HardcodedHeader
      : VARIANT_MAP[h?.variant || "classic"] || Header;

  return (
    <>
      <Comp />
      {!isShowcase && <CartDrawer />}
    </>
  );
}
