"use client";

import dynamic from "next/dynamic";
import { useSettings } from "@/contexts/SettingsContext";
import { LuxuryFooter } from "@/components/home/LuxuryFooter";
import type { FooterVariant } from "@/types";

const FooterMinimal = dynamic(
  () => import("@/components/home/FooterMinimal").then((m) => ({ default: m.FooterMinimal })),
  { loading: () => <LuxuryFooter /> }
);
const FooterColumns = dynamic(
  () => import("@/components/home/FooterColumns").then((m) => ({ default: m.FooterColumns })),
  { loading: () => <LuxuryFooter /> }
);
const FooterBold = dynamic(
  () => import("@/components/home/BoldFooter").then((m) => ({ default: m.BoldFooter })),
  { loading: () => <LuxuryFooter /> }
);
const FooterElegant = dynamic(
  () => import("@/components/home/ElegantFooter").then((m) => ({ default: m.ElegantFooter })),
  { loading: () => <LuxuryFooter /> }
);
const FooterZen = dynamic(
  () => import("@/components/home/ZenFooter").then((m) => ({ default: m.ZenFooter })),
  { loading: () => <LuxuryFooter /> }
);
const FooterPlayful = dynamic(
  () => import("@/components/home/PlayfulFooter").then((m) => ({ default: m.PlayfulFooter })),
  { loading: () => <LuxuryFooter /> }
);
const FooterTech = dynamic(
  () => import("@/components/home/TechFooter").then((m) => ({ default: m.TechFooter })),
  { loading: () => <LuxuryFooter /> }
);
const FooterArtisan = dynamic(
  () => import("@/components/home/ArtisanFooter").then((m) => ({ default: m.ArtisanFooter })),
  { loading: () => <LuxuryFooter /> }
);
const FooterMagazine = dynamic(
  () => import("@/components/home/MagazineFooter").then((m) => ({ default: m.MagazineFooter })),
  { loading: () => <LuxuryFooter /> }
);

const VARIANT_MAP: Record<FooterVariant, React.ComponentType> = {
  luxury: LuxuryFooter,
  minimal: FooterMinimal,
  columns: FooterColumns,
  bold: FooterBold,
  elegant: FooterElegant,
  zen: FooterZen,
  playful: FooterPlayful,
  tech: FooterTech,
  artisan: FooterArtisan,
  magazine: FooterMagazine,
};

const HardcodedFooterImpl = dynamic(
  () => import("@/components/home/HardcodedHomepage").then((m) => ({ default: m.HardcodedFooter })),
  { loading: () => <LuxuryFooter /> }
);

function HardcodedFooter() {
  return <HardcodedFooterImpl />;
}

export function FooterSwitcher() {
  const { settings } = useSettings();
  const f = settings?.footer;

  if (f?.enabled === false) return null;

  const Comp =
    f?.mode === "hardcoded"
      ? HardcodedFooter
      : VARIANT_MAP[f?.variant || "luxury"] || LuxuryFooter;

  return <Comp />;
}
