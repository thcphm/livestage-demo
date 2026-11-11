import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CITIES, PAY_METHODS, REGIONS, loc, type Locale } from "@/lib/catalog";
import { formatDate } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import { GUARANTEE_PCT } from "@/server/domain/shows";
import { getRates, getShow } from "@/demo/queries";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { BuyTicketsForm } from "@/components/show/buy-tickets-form";
import { ShowDate, SoldBar } from "@/components/show/show-card";

export default async function ShowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const s = getShow(id);
  if (!s) notFound();
  const t = await getTranslations("shows");
  const to = await getTranslations("ops.ticket");
  const locale = (await getLocale()) as Locale;
  const left = s.capacity - s.sold;
  const cur = currencyOf(s.region);
  const rates = getRates();

  return (
    <div className="wrap py-6 sm:py-10">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_400px] gap-8 lg:gap-12">
        <div className="min-w-0">
          <div className="flex items-end gap-5">
            <div className="shrink-0 rounded-md bg-gold px-4 py-3"><ShowDate date={s.date} start={s.start} locale={locale} size="lg" /></div>
            <h1 className="h-page min-w-0">{s.title}</h1>
          </div>
          <div className="relative mt-6 aspect-[16/9] overflow-hidden rounded-lg bg-surface2">
            <Image src={s.artist?.photo ?? s.venue.photo} alt="" fill priority sizes="800px" className="object-cover" />
          </div>

          {s.substitution && s.artist && (
            <div className="mt-6 rounded-lg border border-ink/25 bg-gold px-4 py-3">
              <div className="display text-[17px]">{to("lineup")}</div>
              <p className="mt-1 text-[15px]">{to("lineupText", { to: s.artist.name, from: s.substitution.from })}{s.substitution.reason ? ` ${s.substitution.reason}.` : ""}</p>
              <p className="text-[14px] opacity-80">{to("lineupKeep")}</p>
            </div>
          )}

          {s.cancelled && (
            <div className="mt-6 rounded-lg border border-bad/40 bg-badsoft px-4 py-3">
              <div className="display text-[17px] text-bad">{to("cancelled")}</div>
              <p className="mt-1 text-[15px]">{to("cancelledText")}</p>
            </div>
          )}

          <div className={`mt-6 rounded-lg px-4 py-4 ${s.cancelled ? "hidden" : s.guaranteed ? "bg-accentsoft" : "bg-surface2"}`}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="flex items-center gap-2 font-semibold">
                {s.guaranteed && <Icon name="shield" size={18} className="text-accent" />}
                {s.guaranteed ? to("guaranteed") : to("needMore", { count: s.toGuarantee })}
              </span>
              <span className="text-[14px] text-muted tnum">{to("sold", { sold: s.sold, capacity: s.capacity })}</span>
            </div>
            <div className="mt-3"><SoldBar sold={s.sold} capacity={s.capacity} guaranteed={s.guaranteed} /></div>
            <p className="mt-3 text-[14px] text-muted">{s.guaranteed ? to("guaranteedHint", { pct: GUARANTEE_PCT }) : `${to("needHint", { pct: GUARANTEE_PCT })} ${to("decideBy", { date: formatDate(s.decideBy, locale) })}`}</p>
          </div>

          <dl className="mt-6 divide-y divide-line border-y border-line text-[15px]">
            {s.artist && (
              <div className="flex items-center gap-4 py-3">
                <dt className="w-24 text-muted">{t("artist")}</dt>
                <dd className="flex items-center gap-3">
                  <Avatar name={s.artist.name} src={s.artist.photo} size={36} />
                  <span>
                    <Link href={`/artists/${s.artist.slug}`} className="link-mark">{s.artist.name}</Link>
                    <span className="block text-[14px] text-muted">{s.artist.genres.slice(0, 2).join(", ")}</span>
                  </span>
                </dd>
              </div>
            )}
            <div className="flex gap-4 py-3">
              <dt className="w-24 text-muted">{t("venue")}</dt>
              <dd><div className="font-semibold">{s.venue.name}</div><div className="text-muted">{s.address}, {loc(CITIES[s.city].name, locale)}</div></dd>
            </div>
            <div className="flex gap-4 py-3">
              <dt className="w-24 text-muted">{t("when")}</dt>
              <dd>{formatDate(s.date, locale)}, {s.start}. {t("hours", { count: s.duration })}</dd>
            </div>
            {s.comboPrice !== null && s.comboIncludes && (
              <div className="flex gap-4 py-3">
                <dt className="w-24 text-muted">{to("combo")}</dt>
                <dd><span className="font-semibold tnum">{formatMoney(s.comboPrice, cur, locale)}</span> <span className="text-muted">{loc(s.comboIncludes, locale)}</span></dd>
              </div>
            )}
          </dl>
        </div>

        <aside className="lg:sticky lg:top-24 self-start rounded-lg border border-ink/25 bg-surface p-5">
          <div className="flex items-baseline justify-between">
            <h2 className="display text-[19px]">{t("buy")}</h2>
            <span className={`text-[14px] ${left > 0 && !s.cancelled ? "text-muted" : "text-bad font-semibold"}`}>{s.cancelled ? to("cancelled") : left > 0 ? t("left", { count: left }) : t("soldOut")}</span>
          </div>
          {left > 0 && !s.cancelled && (
            <BuyTicketsForm
              showId={s.id}
              price={s.price}
              combo={s.comboPrice !== null ? { price: s.comboPrice, includes: loc(s.comboIncludes, locale) } : null}
              currency={cur}
              max={Math.min(10, left)}
              methods={REGIONS[s.region].payMethods.map((m) => ({ value: m, label: loc(PAY_METHODS[m].name, locale) }))}
              rates={{ customerBps: rates.customerBps, cardBps: rates.cardBps }}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
