"use client";

import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useSettings } from "@/contexts/SettingsContext";
import type { NavigationItem } from "@/types";

/** Built-in page registry: key → { href, labelKey (i18n common namespace) } */
export const BUILTIN_PAGES: Record<string, { href: string; labelKey: string }> = {
  "shop":            { href: "/products",             labelKey: "nav.shop" },
  "categories":      { href: "/categories",           labelKey: "nav.categories" },
  "new-arrivals":    { href: "/products?sort=newest",  labelKey: "nav.newArrivals" },
  "contact":         { href: "/contact",              labelKey: "nav.contact" },
  "faq":             { href: "/faq",                  labelKey: "nav.faq" },
  "terms":           { href: "/terms",                labelKey: "nav.terms" },
  "privacy":         { href: "/privacy",              labelKey: "nav.privacy" },
  "shipping-policy": { href: "/shipping-policy",      labelKey: "nav.shippingPolicy" },
  "refund-policy":   { href: "/refund-policy",        labelKey: "nav.refundPolicy" },
  "wishlist":        { href: "/wishlist",             labelKey: "nav.wishlist" },
};

const DEFAULT_MENU: NavigationItem[] = [
  { id: "default-shop",       type: "builtin", builtinPage: "shop",         label: "", labelFr: "", href: "", enabled: true, openInNewTab: false },
  { id: "default-categories", type: "builtin", builtinPage: "categories",   label: "", labelFr: "", href: "", enabled: true, openInNewTab: false },
  { id: "default-new",        type: "builtin", builtinPage: "new-arrivals", label: "", labelFr: "", href: "", enabled: true, openInNewTab: false },
  { id: "default-contact",    type: "builtin", builtinPage: "contact",      label: "", labelFr: "", href: "", enabled: true, openInNewTab: false },
];

export interface ResolvedNavItem {
  id: string;
  label: string;
  href: string;
  openInNewTab: boolean;
  children: ResolvedNavItem[];
}

export function useNavigation(): ResolvedNavItem[] {
  const { settings } = useSettings();
  const { t, i18n } = useTranslation("common");
  const lang = i18n.language;
  const menu = settings?.navigation?.mainMenu;

  return useMemo(() => {
    const items = menu && menu.length > 0 ? menu : DEFAULT_MENU;

    const resolveItem = (item: NavigationItem): ResolvedNavItem | null => {
      if (!item.enabled) return null;

      // Resolve href
      let href = item.href;
      if (item.type === "builtin" && item.builtinPage && BUILTIN_PAGES[item.builtinPage]) {
        href = BUILTIN_PAGES[item.builtinPage].href;
      }
      if (!href) return null;

      // Resolve label: custom label override > i18n built-in key
      let label = lang === "fr" ? (item.labelFr || item.label) : item.label;
      if (!label && item.type === "builtin" && item.builtinPage && BUILTIN_PAGES[item.builtinPage]) {
        label = t(BUILTIN_PAGES[item.builtinPage].labelKey);
      }
      if (!label) label = href;

      // Resolve children
      const children = (item.children || [])
        .map(resolveItem)
        .filter((c): c is ResolvedNavItem => c !== null);

      return { id: item.id, label, href, openInNewTab: item.openInNewTab, children };
    };

    return items.map(resolveItem).filter((i): i is ResolvedNavItem => i !== null);
  }, [menu, lang, t]);
}
