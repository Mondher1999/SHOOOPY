"use client";

import { useEffect, useRef } from "react";
import { useSettings } from "@/contexts/SettingsContext";

/**
 * Injects CSS custom properties for the color palette and typography
 * onto the <html> element, and loads Google Fonts dynamically via a
 * <link> tag in the document head. Reads from SettingsContext.
 */

const GOOGLE_FONTS_LINK_ID = "shopflow-google-fonts";

/** Build a Google Fonts <link> URL for one or two font families */
function buildGoogleFontsUrl(heading: string, body: string): string | null {
  const families: string[] = [];
  if (heading) families.push(`family=${encodeURIComponent(heading)}:wght@400;500;600;700`);
  if (body) families.push(`family=${encodeURIComponent(body)}:wght@300;400;500;600;700`);
  if (families.length === 0) return null;
  return `https://fonts.googleapis.com/css2?${families.join("&")}&display=swap`;
}

export function ThemeInjector() {
  const { settings } = useSettings();
  const prevUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!settings) return;

    const root = document.documentElement;
    const typo = settings.typography;
    const colors = settings.colorPalette;

    // ── Typography CSS variables ───────────────────────────────────
    if (typo) {
      if (typo.headingFont) {
        root.style.setProperty("--font-heading", `"${typo.headingFont}"`);
      } else {
        root.style.removeProperty("--font-heading");
      }

      if (typo.bodyFont) {
        root.style.setProperty("--font-body", `"${typo.bodyFont}"`);
      } else {
        root.style.removeProperty("--font-body");
      }

      if (typo.baseFontSize && typo.baseFontSize !== 16) {
        root.style.setProperty("--allure-base-font-size", `${typo.baseFontSize}px`);
        root.style.fontSize = `${typo.baseFontSize}px`;
      } else {
        root.style.removeProperty("--allure-base-font-size");
        root.style.removeProperty("font-size");
      }

      if (typo.headingLetterSpacing !== undefined) {
        root.style.setProperty("--allure-heading-letter-spacing", `${typo.headingLetterSpacing}em`);
      }

      if (typo.headingTextTransform) {
        root.style.setProperty("--allure-heading-text-transform", typo.headingTextTransform);
      }
    }

    // ── Color palette CSS variables ────────────────────────────────
    if (colors) {
      const colorMap: Record<string, string> = {
        bg: "--allure-bg",
        bgAlt: "--allure-bg-alt",
        text: "--allure-text",
        textMuted: "--allure-text-muted",
        dark: "--allure-dark",
        accentText: "--allure-text-on-dark",
        border: "--allure-border",
        sale: "--allure-sale",
      };

      for (const [field, cssVar] of Object.entries(colorMap)) {
        const value = colors[field as keyof typeof colors];
        if (value && /^#[0-9a-fA-F]{6}$/.test(value)) {
          root.style.setProperty(cssVar, value);
        }
      }

      // Also set bg-section as slightly darker version of bgAlt
      if (colors.bgAlt && /^#[0-9a-fA-F]{6}$/.test(colors.bgAlt)) {
        root.style.setProperty("--allure-bg-section", colors.bgAlt);
      }

      // Set border-dark based on dark color
      if (colors.dark && /^#[0-9a-fA-F]{6}$/.test(colors.dark)) {
        root.style.setProperty("--allure-border-dark", colors.dark);
      }
    }

    // ── Google Fonts <link> injection ──────────────────────────────
    const fontsUrl = buildGoogleFontsUrl(typo?.headingFont || "", typo?.bodyFont || "");

    if (fontsUrl !== prevUrlRef.current) {
      prevUrlRef.current = fontsUrl;
      const existing = document.getElementById(GOOGLE_FONTS_LINK_ID);
      if (existing) existing.remove();

      if (fontsUrl) {
        const link = document.createElement("link");
        link.id = GOOGLE_FONTS_LINK_ID;
        link.rel = "stylesheet";
        link.href = fontsUrl;
        document.head.appendChild(link);
      }
    }
  }, [settings]);

  // This component renders nothing — it only produces side effects
  return null;
}
