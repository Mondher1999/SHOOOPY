"use client";

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

interface LoadingContextValue {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

const LoadingContext = createContext<LoadingContextValue | undefined>(undefined);

export function LoadingProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(false);

  const setLoading = useCallback((loading: boolean) => setIsLoading(loading), []);

  const value = useMemo(() => ({ isLoading, setLoading }), [isLoading, setLoading]);

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
}

export function useLoading(): LoadingContextValue {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error("useLoading must be used within a LoadingProvider");
  }
  return context;
}
