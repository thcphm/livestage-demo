import { REGIONS, type Currency, type Locale, type RegionId } from "./catalog";

/**
 * Money is always an integer in the currency's minor unit:
 * VND has no minor unit (1 = 1 đồng), CAD uses cents (100 = $1.00).
 */
export const MINOR_DIGITS: Record<Currency, number> = { VND: 0, CAD: 2 };

export const currencyOf = (region: RegionId): Currency => REGIONS[region].currency;

/** Convert a major-unit amount typed by a user (e.g. 12.5 CAD) to minor units. */
export function toMinor(major: number, currency: Currency): number {
  return Math.round(major * 10 ** MINOR_DIGITS[currency]);
}

export function toMajor(minor: number, currency: Currency): number {
  return minor / 10 ** MINOR_DIGITS[currency];
}

/**
 * Full amount, matching the demo:
 * vi + VND → "3.500.000đ" · en + VND → "₫3,500,000" · CAD → Intl currency format.
 * Cents are shown only when the amount is not a whole number of dollars.
 */
export function formatMoney(minor: number, currency: Currency, locale: Locale): string {
  if (!Number.isInteger(minor)) throw new Error(`Money must be an integer in minor units, got ${minor}`);
  if (currency === "VND") {
    return locale === "vi" ? `${minor.toLocaleString("vi-VN")}đ` : `₫${minor.toLocaleString("en-US")}`;
  }
  const major = toMajor(minor, currency);
  const digits = minor % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(locale === "vi" ? "vi-VN" : "en-CA", {
    style: "currency",
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(major);
}

/** Compact amount for cards and badges: VND in millions ("3,5tr" / "₫3.5M"), CAD as full amount. */
export function formatMoneyShort(minor: number, currency: Currency, locale: Locale): string {
  if (currency !== "VND") return formatMoney(minor, currency, locale);
  const millions = minor / 1_000_000;
  return locale === "vi"
    ? `${millions.toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr`
    : `₫${millions.toLocaleString("en-US", { maximumFractionDigits: 1 })}M`;
}

/** Deposit for a quote total, rounded to the nearest minor unit. */
export function depositAmount(totalMinor: number, depositPct: number): number {
  return Math.round((totalMinor * depositPct) / 100);
}
