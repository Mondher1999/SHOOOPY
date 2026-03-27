"use client";

import React from "react";
import { I18nextProvider } from "react-i18next";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { WishlistProvider } from "@/contexts/WishlistContext";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { WebVitals } from "@/components/WebVitals";
import { AnalyticsScripts } from "@/components/AnalyticsScripts";
import i18n from "@/lib/i18n";
// ↑ Importing i18n triggers the module-scope language sync (reads localStorage
//   before React renders). No useEffect needed — see lib/i18n/index.ts.

interface ClientProvidersProps {
  children: React.ReactNode;
  lang?: string;
}

export function ClientProviders({ children, lang }: ClientProvidersProps) {
  // Sync i18n to the server-resolved language (from cookie) before first render.
  // Runs during both SSR and client hydration so server and client produce the
  // same language, eliminating the hydration mismatch.
  if (lang && i18n.language !== lang) {
    i18n.changeLanguage(lang);
  }

  return (
    <I18nextProvider i18n={i18n}>
      <SettingsProvider>
        <ThemeProvider>
          <AuthProvider>
            <CartProvider>
              <WishlistProvider>
                <LoadingProvider>
                  <WebVitals />
                  <AnalyticsScripts />
                  {children}
                </LoadingProvider>
              </WishlistProvider>
            </CartProvider>
          </AuthProvider>
        </ThemeProvider>
      </SettingsProvider>
    </I18nextProvider>
  );
}
