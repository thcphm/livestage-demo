import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CITIES, loc, type Locale } from "@/lib/catalog";
import { parseYmd } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import { GUARANTEE_PCT } from "@/server/domain/shows";
import type { ShowCard as Show } from "@/demo/queries";

const DOW = { vi: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"], en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] };
const MON = { vi: (m: number) => `Th${m}`, en: (m: number) => ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][m - 1] };

/** "NOV 21" over "Sat 20:00" – the date leads every show listing, like a venue's bill. */
export function ShowDate({ date, start, locale, size = "md" }: { date: string; start?: string; locale: Locale; size?: "sm" | "md" | "lg" }) {
  const d = parseYmd(date);
  const big = { sm: "text-[24px]", md: "text-[30px]", lg: "text-[40px]" }[size];
  return (
    <span className="block">
      <span className={`datetype block tnum ${big}`}>{MON[locale](d.getUTCMonth() + 1)} {d.getUTCDate()}</span>
      <span className="mt-1 block text-[13px] font-medium opacity-75">{DOW[locale][d.getUTCDay()]}{start ? ` ${start}` : ""}</span>
    </span>
  );
}

/** Seats sold against capacity, with a tick at the 50% guarantee line. */
export function SoldBar({ sold, capacity, guaranteed }: { sold: number; capacity: number; guaranteed: boolean }) {
  const pct = Math.min(100, Math.round((sold / Math.max(1, capacity)) * 100));
  return (
    <div className="relative h-2 rounded-full bg-surface2" aria-hidden="true">
      <div className={`h-full rounded-full ${guaranteed ? "bg-accent" : "bg-ink/35"}`} style={{ width: `${Math.max(3, pct)}%` }} />
      <span className="absolute -top-1 h-4 w-0.5 bg-ink" style={{ left: `${GUARANTEE_PCT}%` }} />
    </div>
  );
}

/** Ticketed show: date on a marquee-yellow tab, photo, title, venue and city, price and seats left. */
export async function ShowCard({ s }: { s: Show }) {
  const t = await getTranslations("shows");
  const locale = (await getLocale()) as Locale;
  const left = s.capacity - s.sold;
  return (
    <Link href={`/shows/${s.id}`} className="group block min-w-0">
      <div className="relative aspect-[4/3] overflow-hidden rounded-lg bg-surface2">
        <Image src={s.artist?.photo ?? s.venue.photo} alt="" fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
        <div className="absolute left-3 top-3 rounded-md bg-surface px-2.5 py-1.5 text-ink shadow-sm">
          <ShowDate date={s.date} start={s.start} locale={locale} size="sm" />
        </div>
        {s.comboPrice !== null && <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[12.5px] font-semibold text-white">{t("comboTag")}</span>}
      </div>
      <div className="pt-3 space-y-1.5">
        <div className="display text-[18px] leading-tight truncate group-hover:underline decoration-accent decoration-2 underline-offset-4">{s.title}</div>
        <div className="text-[14.5px] text-muted truncate">{s.venue.name}, {loc(CITIES[s.city].name, locale)}</div>
        <div className="flex items-center justify-between text-[14.5px]">
          <span className="font-bold tnum">{formatMoney(s.price, currencyOf(s.region), locale)}</span>
          <span className={left > 0 ? "text-muted" : "text-bad font-semibold"}>{left > 0 ? t("left", { count: left }) : t("soldOut")}</span>
        </div>
        <SoldBar sold={s.sold} capacity={s.capacity} guaranteed={s.guaranteed} />
        <div className={`text-[13px] font-semibold ${s.guaranteed ? "text-accent" : "text-muted"}`}>{s.guaranteed ? t("guaranteed") : t("needMore", { pct: GUARANTEE_PCT })}</div>
      </div>
    </Link>
  );
}
