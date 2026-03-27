/**
 * TVA (VAT) calculation utilities.
 *
 * Prices stored in DB are HT (Hors Taxes / pre-tax).
 * Prices displayed to customers are TTC (Toutes Taxes Comprises / tax-inclusive).
 *
 * Formula: TTC = HT × (1 + tva / 100)
 */

/** Compute TTC price from HT price and TVA rate (%). */
export function calcTTC(priceHT: number, tva: number): number {
  return priceHT * (1 + (tva || 0) / 100);
}

/** Compute the TVA amount (TTC - HT). */
export function calcTVAAmount(priceHT: number, tva: number): number {
  return priceHT * ((tva || 0) / 100);
}

/** Compute total TVA amount for a list of items with price (HT), tva, and quantity. */
export function calcTotalTVA(items: { price: number; tva?: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + calcTVAAmount(item.price, item.tva ?? 0) * item.quantity, 0);
}

/** Compute total TTC for a list of items with price (HT), tva, and quantity. */
export function calcTotalTTC(items: { price: number; tva?: number; quantity: number }[]): number {
  return items.reduce((sum, item) => sum + calcTTC(item.price, item.tva ?? 0) * item.quantity, 0);
}
