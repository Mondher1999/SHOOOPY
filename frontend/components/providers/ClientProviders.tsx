"use client";

import React from "react";
import { I18nextProvider } from "react-i18next";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import i18n from "@/lib/i18n";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <CartProvider>
          <LoadingProvider>{children}</LoadingProvider>
        </CartProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
