"use client";

import React from "react";
import { LoadingProvider } from "@/contexts/LoadingContext";

interface ClientProvidersProps {
  children: React.ReactNode;
}

/**
 * Client-side provider wrapper.
 * AuthContext will be added in Sprint 2.
 */
export function ClientProviders({ children }: ClientProvidersProps) {
  return <LoadingProvider>{children}</LoadingProvider>;
}
