import { useMemo } from "react";
import { useSettings } from "@/contexts/SettingsContext";

export interface ThemeStyles {
  /** Theme identifier */
  id: string;
  /** Page background */
  pageBg: string;
  /** Primary text color */
  text: string;
  /** Muted text color */
  textMuted: string;
  /** Accent color (buttons, links, badges) */
  accent: string;
  /** Accent hover */
  accentHover: string;
  /** Border color */
  border: string;
  /** Card / surface background */
  surface: string;
  /** Badge background for discounts */
  badgeBg: string;
  /** Badge text */
  badgeText: string;
  /** Primary button classes */
  btnPrimary: string;
  /** Outline button classes */
  btnOutline: string;
  /** Heading extra classes (font-serif, font-mono, etc.) */
  headingClass: string;
  /** Body text extra classes */
  bodyClass: string;
  /** Separator / divider color */
  separator: string;
  /** Star rating fill color */
  starColor: string;
  /** Accent-tinted background (step rings, icon circles) */
  accentBg: string;
  /** Success icon circle background */
  successBg: string;
  /** Success icon color */
  successText: string;
}

const THEME_STYLES: Record<string, ThemeStyles> = {
  classic: {
    id: "classic",
    pageBg: "bg-white",
    text: "text-foreground",
    textMuted: "text-muted-foreground",
    accent: "text-primary",
    accentHover: "hover:text-primary/80",
    border: "border-border",
    surface: "bg-background",
    badgeBg: "bg-primary",
    badgeText: "text-primary-foreground",
    btnPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    btnOutline: "border border-border text-foreground hover:bg-muted",
    headingClass: "",
    bodyClass: "",
    separator: "bg-border",
    starColor: "fill-amber-400 text-amber-400",
    accentBg: "bg-primary/10",
    successBg: "bg-green-100",
    successText: "text-green-600",
  },
  dynamic: {
    id: "dynamic",
    pageBg: "bg-white",
    text: "text-foreground",
    textMuted: "text-muted-foreground",
    accent: "text-primary",
    accentHover: "hover:text-primary/80",
    border: "border-border",
    surface: "bg-background",
    badgeBg: "bg-primary",
    badgeText: "text-primary-foreground",
    btnPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
    btnOutline: "border border-border text-foreground hover:bg-muted",
    headingClass: "",
    bodyClass: "",
    separator: "bg-border",
    starColor: "fill-amber-400 text-amber-400",
    accentBg: "bg-primary/10",
    successBg: "bg-green-100",
    successText: "text-green-600",
  },
  bold: {
    id: "bold",
    pageBg: "bg-white",
    text: "text-[#0F0F0F]",
    textMuted: "text-[#8A8A8A]",
    accent: "text-[#FF3C00]",
    accentHover: "hover:text-[#E03500]",
    border: "border-[#E5E5E5]",
    surface: "bg-[#F7F7F7]",
    badgeBg: "bg-[#FF3C00]",
    badgeText: "text-white",
    btnPrimary: "bg-[#FF3C00] text-white font-bold uppercase tracking-wider hover:bg-[#E03500]",
    btnOutline: "border-2 border-[#0F0F0F] text-[#0F0F0F] font-bold uppercase tracking-wider hover:bg-[#0F0F0F] hover:text-white",
    headingClass: "uppercase tracking-tight",
    bodyClass: "",
    separator: "bg-[#E5E5E5]",
    starColor: "fill-[#FF3C00] text-[#FF3C00]",
    accentBg: "bg-[#FF3C00]/10",
    successBg: "bg-green-100",
    successText: "text-green-600",
  },
  elegant: {
    id: "elegant",
    pageBg: "bg-[#FAF7F2]",
    text: "text-[#2D2A26]",
    textMuted: "text-[#7A7A7A]",
    accent: "text-[#C5A467]",
    accentHover: "hover:text-[#B09050]",
    border: "border-[#E8E0D4]",
    surface: "bg-white",
    badgeBg: "bg-[#C5A467]",
    badgeText: "text-white",
    btnPrimary: "bg-[#C5A467] text-white tracking-wider hover:bg-[#B09050]",
    btnOutline: "border border-[#C5A467] text-[#C5A467] tracking-wider hover:bg-[#C5A467] hover:text-white",
    headingClass: "tracking-wide",
    bodyClass: "",
    separator: "bg-[#E8E0D4]",
    starColor: "fill-[#C5A467] text-[#C5A467]",
    accentBg: "bg-[#C5A467]/10",
    successBg: "bg-green-50",
    successText: "text-green-700",
  },
  zen: {
    id: "zen",
    pageBg: "bg-white",
    text: "text-[#111]",
    textMuted: "text-[#999]",
    accent: "text-[#111]",
    accentHover: "hover:text-[#000]",
    border: "border-[#eee]",
    surface: "bg-[#FAFAFA]",
    badgeBg: "bg-[#111]",
    badgeText: "text-white",
    btnPrimary: "bg-[#111] text-white font-light tracking-wider hover:bg-black",
    btnOutline: "border border-[#ddd] text-[#111]/60 font-light tracking-wider hover:border-[#111] hover:text-[#111]",
    headingClass: "font-light tracking-wide",
    bodyClass: "font-light",
    separator: "bg-[#eee]",
    starColor: "fill-[#111] text-[#111]",
    accentBg: "bg-[#111]/5",
    successBg: "bg-green-50",
    successText: "text-green-700",
  },
  minimal: {
    id: "minimal",
    pageBg: "bg-white",
    text: "text-[#111]",
    textMuted: "text-[#999]",
    accent: "text-[#111]",
    accentHover: "hover:text-[#000]",
    border: "border-[#eee]",
    surface: "bg-[#FAFAFA]",
    badgeBg: "bg-[#111]",
    badgeText: "text-white",
    btnPrimary: "bg-[#111] text-white font-light tracking-wider hover:bg-black",
    btnOutline: "border border-[#ddd] text-[#111]/60 font-light tracking-wider hover:border-[#111] hover:text-[#111]",
    headingClass: "font-light tracking-wide",
    bodyClass: "font-light",
    separator: "bg-[#eee]",
    starColor: "fill-[#111] text-[#111]",
    accentBg: "bg-[#111]/5",
    successBg: "bg-green-50",
    successText: "text-green-700",
  },
  playful: {
    id: "playful",
    pageBg: "bg-[#FDFCFF]",
    text: "text-[#1E1E2E]",
    textMuted: "text-[#4B4869]",
    accent: "text-[#7C3AED]",
    accentHover: "hover:text-[#6D28D9]",
    border: "border-[#E8E5F7]",
    surface: "bg-[#F8F7FF]",
    badgeBg: "bg-[#7C3AED]",
    badgeText: "text-white",
    btnPrimary: "bg-gradient-to-r from-[#7C3AED] to-[#EC4899] text-white font-semibold hover:opacity-90",
    btnOutline: "border border-[#7C3AED] text-[#7C3AED] font-medium hover:bg-[#7C3AED] hover:text-white",
    headingClass: "",
    bodyClass: "",
    separator: "bg-[#E8E5F7]",
    starColor: "fill-[#FBBF24] text-[#FBBF24]",
    accentBg: "bg-[#7C3AED]/10",
    successBg: "bg-green-100",
    successText: "text-green-600",
  },
  tech: {
    id: "tech",
    pageBg: "bg-[#0A0A0F]",
    text: "text-[#E0E0E0]",
    textMuted: "text-[#555566]",
    accent: "text-[#00FF88]",
    accentHover: "hover:text-[#00CC6A]",
    border: "border-[#1E1E2A]",
    surface: "bg-[#12121A]",
    badgeBg: "bg-[#00FF88]",
    badgeText: "text-[#0A0A0F]",
    btnPrimary: "bg-[#00FF88] text-[#0A0A0F] font-mono font-bold uppercase tracking-wider hover:bg-[#00CC6A]",
    btnOutline: "border border-[#00FF88]/50 text-[#00FF88] font-mono tracking-wider hover:bg-[#00FF88]/10 hover:border-[#00FF88]",
    headingClass: "font-mono uppercase tracking-wider",
    bodyClass: "font-mono",
    separator: "bg-[#1E1E2A]",
    starColor: "fill-[#00FF88] text-[#00FF88]",
    accentBg: "bg-[#00FF88]/10",
    successBg: "bg-[#00FF88]/10",
    successText: "text-[#00FF88]",
  },
  artisan: {
    id: "artisan",
    pageBg: "bg-[#FFF8F0]",
    text: "text-[#3D2B1F]",
    textMuted: "text-[#9C8B7E]",
    accent: "text-[#C67B4A]",
    accentHover: "hover:text-[#B06A3A]",
    border: "border-[#E8DDD0]",
    surface: "bg-white",
    badgeBg: "bg-[#C67B4A]",
    badgeText: "text-white",
    btnPrimary: "bg-[#C67B4A] text-white tracking-wider rounded-full hover:bg-[#B06A3A]",
    btnOutline: "border border-[#C67B4A] text-[#C67B4A] tracking-wider rounded-full hover:bg-[#C67B4A] hover:text-white",
    headingClass: "font-serif",
    bodyClass: "",
    separator: "bg-[#E8DDD0]",
    starColor: "fill-[#C67B4A] text-[#C67B4A]",
    accentBg: "bg-[#C67B4A]/10",
    successBg: "bg-green-50",
    successText: "text-green-700",
  },
  magazine: {
    id: "magazine",
    pageBg: "bg-white",
    text: "text-black",
    textMuted: "text-[#6B6B6B]",
    accent: "text-[#E63946]",
    accentHover: "hover:text-[#D12D3A]",
    border: "border-black/10",
    surface: "bg-[#F5F5F5]",
    badgeBg: "bg-[#E63946]",
    badgeText: "text-white",
    btnPrimary: "bg-[#E63946] text-white font-bold uppercase tracking-[0.15em] hover:bg-[#D12D3A]",
    btnOutline: "border-2 border-black text-black font-bold uppercase tracking-wider hover:bg-black hover:text-white",
    headingClass: "font-black uppercase tracking-tight",
    bodyClass: "",
    separator: "bg-black/10",
    starColor: "fill-[#E63946] text-[#E63946]",
    accentBg: "bg-[#E63946]/10",
    successBg: "bg-green-100",
    successText: "text-green-600",
  },
};

function resolveTemplate(hp: { template?: string; mode?: string } | undefined): string {
  if (hp?.template) return hp.template;
  if (hp?.mode === "hardcoded") return "classic";
  if (hp?.mode === "dynamic") return "dynamic";
  return "classic";
}

/**
 * Returns the active theme's style configuration.
 * Use this to apply theme-aware styling to product pages, wishlist, etc.
 */
export function useActiveTheme(): ThemeStyles {
  const { settings } = useSettings();

  return useMemo(() => {
    const themeId = resolveTemplate(settings?.homepage);
    return THEME_STYLES[themeId] ?? THEME_STYLES.classic;
  }, [settings?.homepage]);
}
