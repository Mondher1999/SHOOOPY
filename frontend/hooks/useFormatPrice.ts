import { useCallback } from "react";
import { useSettings } from "@/contexts/SettingsContext";
import { formatPrice as formatPriceFn } from "@/lib/currency";

export function useFormatPrice() {
  const { settings } = useSettings();
  const currencyCode = settings?.store?.currency || "USD";

  const formatPrice = useCallback(
    (amount: number) => formatPriceFn(amount, currencyCode),
    [currencyCode],
  );

  return formatPrice;
}
