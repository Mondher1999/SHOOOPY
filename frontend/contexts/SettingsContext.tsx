"use client";

import { createContext, useContext, useState, useEffect, useCallback, useMemo, type ReactNode } from "react";
import { getSettingsAPI } from "@/services/settings-service";
import type { SiteSettings } from "@/types";
import logger from "@/lib/logger";

interface SettingsContextType {
  settings: SiteSettings | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  update: (settings: SiteSettings) => void;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: null,
  isLoading: true,
  refetch: async () => {},
  update: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await getSettingsAPI();
      setSettings(res.data);
    } catch (err) {
      logger.error("Failed to load settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const value = useMemo(
    () => ({ settings, isLoading, refetch: fetchSettings, update: setSettings }),
    [settings, isLoading, fetchSettings]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
