"use client";

import React from "react";
import { I18nextProvider } from "react-i18next";
import { LoadingProvider } from "@/contexts/LoadingContext";
import { AuthProvider } from "@/contexts/AuthContext";
import i18n from "@/lib/i18n";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <LoadingProvider>{children}</LoadingProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}
