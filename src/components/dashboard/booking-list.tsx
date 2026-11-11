import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CITIES, loc, type Locale } from "@/lib/catalog";
import { formatShortDate } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import type { BookingRow } from "@/demo/queries";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";

/** Bordered rows (not cards) – dense, scannable, one link per booking. */
export async function BookingList({ rows, empty }: { rows: BookingRow[]; empty?: string }) {
  const t = await getTranslations("dash");
  const tb = await getTranslations("booking");
  const locale = (await getLocale()) as Locale;
  if (!rows.length) return <p className="text-sm text-muted">{empty ?? t("empty")}</p>;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-lg border border-line bg-surface">
      {rows.map((r) => (
        <li key={r.id}>
          <Link href={`/dashboard/bookings/${r.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-surface2">
            <div className="w-14 shrink-0">
              <div className="display text-[16px] tnum">{formatShortDate(r.date, locale)}</div>
              <div className="text-xs text-muted">{r.start}</div>
            </div>
            {r.counterpart && <Avatar name={r.counterpart} src={r.counterpartPhoto} size={32} />}
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{r.title}</div>
              <div className="text-[13.5px] text-muted truncate">
                {r.counterpart || tb("noArtist")}, {loc(CITIES[r.city].name, locale)}
                {r.ticketing && `. ${tb("ticketsSold", { sold: r.sold, capacity: r.ticketing.capacity })}`}
              </div>
            </div>
            {r.flagged && <Badge tone="bad">{tb("flagged")}</Badge>}
            {r.price !== null && <span className="hidden sm:block text-sm tnum text-muted">{formatMoney(r.price, currencyOf(r.region), locale)}</span>}
            <StatusBadge status={r.status} />
          </Link>
        </li>
      ))}
    </ul>
  );
}
