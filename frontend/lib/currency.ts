export interface CurrencyConfig {
  code: string;
  symbol: string;
  name: string;
  position: "before" | "after";
  locale: string;
  decimals: number;
}

export const CURRENCIES: CurrencyConfig[] = [
  { code: "TND", symbol: "DT", name: "Tunisian Dinar", position: "after", locale: "fr-TN", decimals: 3 },
  { code: "USD", symbol: "$", name: "US Dollar", position: "before", locale: "en-US", decimals: 2 },
  { code: "EUR", symbol: "\u20ac", name: "Euro", position: "after", locale: "fr-FR", decimals: 2 },
  { code: "GBP", symbol: "\u00a3", name: "British Pound", position: "before", locale: "en-GB", decimals: 2 },
  { code: "MAD", symbol: "MAD", name: "Moroccan Dirham", position: "after", locale: "fr-MA", decimals: 2 },
  { code: "DZD", symbol: "DA", name: "Algerian Dinar", position: "after", locale: "fr-DZ", decimals: 2 },
  { code: "SAR", symbol: "SAR", name: "Saudi Riyal", position: "after", locale: "ar-SA", decimals: 2 },
  { code: "AED", symbol: "AED", name: "UAE Dirham", position: "after", locale: "ar-AE", decimals: 2 },
  { code: "EGP", symbol: "E\u00a3", name: "Egyptian Pound", position: "before", locale: "ar-EG", decimals: 2 },
  { code: "QAR", symbol: "QAR", name: "Qatari Riyal", position: "after", locale: "ar-QA", decimals: 2 },
  { code: "KWD", symbol: "KWD", name: "Kuwaiti Dinar", position: "after", locale: "ar-KW", decimals: 3 },
  { code: "LYD", symbol: "LD", name: "Libyan Dinar", position: "after", locale: "ar-LY", decimals: 3 },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar", position: "before", locale: "en-CA", decimals: 2 },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc", position: "after", locale: "fr-CH", decimals: 2 },
  { code: "TRY", symbol: "\u20ba", name: "Turkish Lira", position: "after", locale: "tr-TR", decimals: 2 },
];

const currencyByCode = new Map(CURRENCIES.map((c) => [c.code, c]));
const currencyBySymbol = new Map(CURRENCIES.map((c) => [c.symbol, c]));

export function getCurrency(codeOrSymbol: string): CurrencyConfig {
  return currencyByCode.get(codeOrSymbol)
    ?? currencyBySymbol.get(codeOrSymbol)
    ?? CURRENCIES[1]; // fallback to USD
}

export function formatPrice(amount: number, currencyCode: string = "USD"): string {
  const c = getCurrency(currencyCode);
  const formatted = amount.toLocaleString(c.locale, {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
  return c.position === "before"
    ? `${c.symbol}${formatted}`
    : `${formatted} ${c.symbol}`;
}
