import type { Locale } from "./catalog";

/**
 * Show dates are calendar dates ("YYYY-MM-DD") local to the show's city, so they are
 * parsed and formatted as plain dates without any time-zone conversion.
 */

const DOW_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const YMD = /^(\d{4})-(\d{2})-(\d{2})$/;

const pad = (n: number) => String(n).padStart(2, "0");

export function parseYmd(ymd: string): Date {
  const m = YMD.exec(ymd);
  if (!m) throw new Error(`Invalid date "${ymd}", expected YYYY-MM-DD`);
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(Date.UTC(y, mo - 1, d));
  if (date.getUTCMonth() !== mo - 1 || date.getUTCDate() !== d) throw new Error(`Invalid date "${ymd}"`);
  return date;
}

export const toYmd = (date: Date): string =>
  `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;

/** Today's calendar date in a given IANA time zone. */
export function todayIn(timeZone: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

/** vi → "T6, 06/11/2026" · en → "Fri, Nov 6, 2026" */
export function formatDate(ymd: string, locale: Locale): string {
  const d = parseYmd(ymd);
  if (locale === "en") {
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
  }
  return `${DOW_VI[d.getUTCDay()]}, ${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

/** vi → "06/11" · en → "Nov 6" */
export function formatShortDate(ymd: string, locale: Locale): string {
  const d = parseYmd(ymd);
  if (locale === "en") return d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${pad(d.getUTCDate())}/${pad(d.getUTCMonth() + 1)}`;
}

/** vi → "3 giờ" · en → "3 h" */
export const formatHours = (hours: number, locale: Locale): string =>
  locale === "vi" ? `${hours} giờ` : `${hours} h`;

/** vi → "10–15/12" (or "28/11–02/12") · en → "Dec 10–15" (or "Nov 28 – Dec 2") */
export function formatDateRange(from: string, to: string, locale: Locale): string {
  const a = parseYmd(from);
  const b = parseYmd(to);
  const sameMonth = a.getUTCMonth() === b.getUTCMonth() && a.getUTCFullYear() === b.getUTCFullYear();
  if (from === to) return formatShortDate(from, locale);
  if (locale === "en") {
    return sameMonth ? `${formatShortDate(from, locale)}–${b.getUTCDate()}` : `${formatShortDate(from, locale)} – ${formatShortDate(to, locale)}`;
  }
  return sameMonth ? `${a.getUTCDate()}–${formatShortDate(to, locale)}` : `${formatShortDate(from, locale)}–${formatShortDate(to, locale)}`;
}

/** "2026-10-28T09:10" → vi "28/10 09:10" · en "Oct 28, 09:10" (stored local times, no zone conversion). */
export function formatStamp(iso: string, locale: Locale): string {
  return `${formatShortDate(iso.slice(0, 10), locale)}${locale === "en" ? "," : ""} ${iso.slice(11, 16)}`;
}
