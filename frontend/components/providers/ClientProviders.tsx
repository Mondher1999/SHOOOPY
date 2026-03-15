"use client";

import React, { useEffect } from "react";
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

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  // Switch to stored language AFTER hydration to avoid SSR/client mismatch.
  // i18n always initializes with "en" (matching SSR); this effect runs only on the client.
  useEffect(() => {
    const stored = localStorage.getItem("shopflow_language");
    if (stored && stored !== i18n.language) {
      i18n.changeLanguage(stored);
    }
  }, []);

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
