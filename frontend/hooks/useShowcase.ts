import { useSettings } from "@/contexts/SettingsContext";

export function useShowcase(): boolean {
  const { settings } = useSettings();
  return settings?.store?.showcaseMode ?? false;
}
