import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { type Locale } from "@/lib/catalog";
import { currencyOf, formatMoney } from "@/lib/money";
import { embedVenue } from "@/demo/queries";
import { DEMO_TODAY, getStore } from "@/demo/store";
import { ReservationForm } from "@/components/embed/reservation-form";
import { ShowDate } from "@/components/show/show-card";
import { buttonClass } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

// Reads the live demo data and the reservation just made.
export const dynamic = "force-dynamic";

/**
 * The widget a restaurant embeds in the Reservations section of its own website (an iframe).
 * Guests request a table or go to tickets for a show night; nothing here needs an account.
 */
export default async function VenueWidgetPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ reserved?: string }> }) {
  const { id } = await params;
  const data = embedVenue(id);
  if (!data) notFound();
  const t = await getTranslations("ops.embed");
  const ts = await getTranslations("shows");
  const locale = (await getLocale()) as Locale;
  const { venue, shows } = data;
  const cur = currencyOf(venue.region);
  const { reserved } = await searchParams;
  const done = reserved ? getStore().reservations.find((r) => r.id === reserved && r.venueId === venue.id) : undefined;

  return (
    <div data-theme="light" className="min-h-screen"><div className="mx-auto max-w-3xl p-4 sm:p-6">
      {done ? (
        <div className="rounded-lg border border-ink/25 p-6 text-center">
          <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-gold"><Icon name="check" size={24} /></span>
          <h1 className="h-sec mt-4">{t("done")}</h1>
          <p className="mt-2 text-muted">{t("doneText", { venue: venue.name, ref: done.id.slice(-6).toUpperCase() })}</p>
          <Link href={`/embed/venue/${venue.id}`} className={buttonClass("ghost", "md", "mt-5")}>{t("again")}</Link>
        </div>
      ) : (
        <>
          {shows.length > 0 && (
            <section>
              <h2 className="h-sub">{t("upcoming")}</h2>
              <ul className="mt-3 border-t border-ink/20">
                {shows.map((s) => (
                  <li key={s.id} className="flex items-center gap-4 border-b border-line py-3">
                    <div className="w-24 shrink-0"><ShowDate date={s.date} start={s.start} locale={locale} size="sm" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="display text-[17px] leading-tight">{s.title}</div>
                      <div className="text-[14px] text-muted">
                        {t("from", { price: formatMoney(s.price, cur, locale) })}
                        {s.comboPrice !== null && `. ${t("comboFrom", { price: formatMoney(s.comboPrice, cur, locale) })}`}
                      </div>
                    </div>
                    {/* Tickets open on LiveStage in a new tab so the guest keeps the restaurant's page. */}
                    <Link href={`/shows/${s.id}`} target="_blank" className={buttonClass("primary", "sm")}>{ts("buy")}</Link>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section className={shows.length ? "mt-8" : ""}>
            <h2 className="h-sub">{t("reserve")}</h2>
            <div className="mt-4">
              <ReservationForm
                venueId={venue.id}
                minDate={DEMO_TODAY}
                shows={shows.map((s) => ({ value: s.id, label: `${s.date}, ${s.start}. ${s.title}` }))}
              />
            </div>
          </section>
        </>
      )}
      <p className="mt-8 border-t border-line pt-3 text-[13px] text-muted">{t("poweredBy")}</p>
    </div></div>
  );
}
