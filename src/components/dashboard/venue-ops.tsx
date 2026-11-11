import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { loc, type Locale } from "@/lib/catalog";
import { formatDate } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import { formatBps } from "@/server/domain/fees";
import { getRates, venueReservations, venueShows } from "@/demo/queries";
import { cancelShow, checkInTicket, setCombo, setReservationStatus, substituteArtist } from "@/demo/actions";
import { Badge } from "@/components/ui/badge";
import { Field, inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ShowDate, SoldBar } from "@/components/show/show-card";

const box = "rounded-lg border border-line bg-surface";

/**
 * A venue's ticketed shows: sales against the 50% guarantee, the dinner + show combo,
 * replacing the artist, and check-in at the door.
 */
export async function VenueShows({ venueId }: { venueId: string }) {
  const t = await getTranslations("dash");
  const to = await getTranslations("ops.venue");
  const tt = await getTranslations("ops.ticket");
  const locale = (await getLocale()) as Locale;
  const rates = getRates();
  const shows = venueShows(venueId);
  if (!shows.length) return <p className="text-muted">{t("empty")}</p>;

  return (
    <div className="space-y-8">
      {shows.map(({ show: s, tickets, revenue, comboSold, commission, candidates, canCancel }) => {
        const cur = currencyOf(s.region);
        const money = (n: number) => formatMoney(n, cur, locale);
        const major = (n: number) => (s.region === "ca" ? n / 100 : n);
        return (
          <section key={s.id} className={box}>
            <header className="flex flex-wrap items-end gap-x-5 gap-y-3 border-b border-line p-4">
              <div className="rounded-md bg-gold px-3 py-2"><ShowDate date={s.date} start={s.start} locale={locale} size="sm" /></div>
              <div className="min-w-0 flex-1">
                <Link href={`/dashboard/bookings/${s.id}`} className="display text-[19px] leading-tight hover:underline decoration-accent decoration-2 underline-offset-4">{s.title}</Link>
                <div className="mt-2 max-w-md"><SoldBar sold={s.sold} capacity={s.capacity} guaranteed={s.guaranteed} /></div>
                <div className="mt-1.5 text-[14px]">
                  <span className="tnum">{tt("sold", { sold: s.sold, capacity: s.capacity })}</span>{" "}
                  <span className={s.guaranteed ? "font-semibold text-accent" : "text-muted"}>{s.guaranteed ? tt("guaranteed") : tt("needMore", { count: s.toGuarantee })}</span>
                </div>
              </div>
              <dl className="grid grid-cols-3 gap-x-6 text-[14px]">
                <div><dt className="text-muted">{to("revenue")}</dt><dd className="display text-[18px] tnum">{money(revenue)}</dd></div>
                <div><dt className="text-muted">{to("commission")}</dt><dd className="display text-[18px] tnum">{money(commission)}</dd></div>
                <div><dt className="text-muted">{to("net")}</dt><dd className="display text-[18px] tnum">{money(revenue - commission)}</dd></div>
              </dl>
            </header>

            <div className="grid gap-px bg-line lg:grid-cols-2">
              <form action={setCombo} className="space-y-3 bg-surface p-4">
                <input type="hidden" name="booking" value={s.id} />
                <div className="flex items-baseline justify-between gap-2">
                  <h3 className="font-semibold">{to("comboTitle")}</h3>
                  <span className="text-[13.5px] text-muted">{to("comboSold", { count: comboSold })}</span>
                </div>
                <p className="text-[13.5px] text-muted">{to("comboHint", { show: money(s.price), venue: formatBps(rates.venueBps), combo: formatBps(rates.comboBps) })}</p>
                <div className="grid grid-cols-[130px_minmax(0,1fr)] gap-3">
                  <Field label={`${to("comboPrice")} (${cur})`}><input name="price" type="number" min={0} step="1" defaultValue={s.comboPrice !== null ? major(s.comboPrice) : ""} className={inputCls} /></Field>
                  <Field label={to("comboIncludes")}><input name="includes" maxLength={160} defaultValue={loc(s.comboIncludes, locale)} className={inputCls} /></Field>
                </div>
                <SubmitButton className={buttonClass("ghost", "sm")}>{to("comboSave")}</SubmitButton>
              </form>

              <form action={substituteArtist} className="space-y-3 bg-surface p-4">
                <input type="hidden" name="booking" value={s.id} />
                <h3 className="font-semibold">{to("subTitle")}</h3>
                {s.substitution && <p className="rounded-md bg-gold px-2.5 py-1.5 text-[13.5px] font-semibold">{to("subDone", { from: s.substitution.from, to: s.artist?.name ?? "" })}</p>}
                <p className="text-[13.5px] text-muted">{to("subHint")}</p>
                {candidates.length ? (
                  <>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <Field label={to("subPick")}>
                        <select name="artist" className={inputCls}>
                          {candidates.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.rating.toFixed(1)})</option>)}
                        </select>
                      </Field>
                      <Field label={to("subReason")}><input name="reason" maxLength={200} placeholder={to("subReasonPh")} className={inputCls} /></Field>
                    </div>
                    <SubmitButton className={buttonClass("ghost", "sm")}>{to("subDo")}</SubmitButton>
                  </>
                ) : <p className="text-[14px]">{to("subNone")}</p>}
              </form>
            </div>

            {canCancel && (
              <form action={cancelShow} className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line p-4">
                <input type="hidden" name="booking" value={s.id} />
                <p className="min-w-0 flex-1 text-[13.5px] text-muted">{to("cancelHint", { count: tickets.length, date: formatDate(s.decideBy, locale) })}</p>
                <SubmitButton className={buttonClass("danger", "sm")}>{to("cancelDo")}</SubmitButton>
              </form>
            )}

            {tickets.length > 0 && (
              <details className="border-t border-line">
                <summary className="cursor-pointer px-4 py-3 font-semibold">{t("tabs.tickets")} ({tickets.length})</summary>
                <ul className="divide-y divide-line border-t border-line">
                  {tickets.map((x) => (
                    <li key={x.id} className="flex items-center gap-3 px-4 py-2 text-[14px]">
                      <span className="w-28 font-mono">{x.code}</span>
                      <span className="min-w-0 flex-1 truncate">{x.name}, {x.qty}</span>
                      {x.kind === "combo" && <Badge tone="gold">{tt("combo")}</Badge>}
                      {x.checkedIn ? <Badge tone="ok">{t("checkedIn")}</Badge> : (
                        <form action={checkInTicket}><input type="hidden" name="code" value={x.code} /><SubmitButton className={buttonClass("ghost", "sm")}>{t("checkIn")}</SubmitButton></form>
                      )}
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        );
      })}
    </div>
  );
}

/** Table reservations that came in through the widget on the venue's own website. */
export async function VenueReservations({ venueId }: { venueId: string }) {
  const to = await getTranslations("ops.venue");
  const locale = (await getLocale()) as Locale;
  const rows = venueReservations(venueId);
  const tone = { new: "warn", confirmed: "ok", seated: "neutral", cancelled: "bad" } as const;
  const act = (id: string, status: string, label: string, variant: "primary" | "ghost" | "danger") => (
    <form action={setReservationStatus}>
      <input type="hidden" name="reservation" value={id} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton className={buttonClass(variant, "sm")}>{label}</SubmitButton>
    </form>
  );
  return (
    <section>
      <p className="mb-4 max-w-2xl text-muted">{to("resHint")}</p>
      {rows.length ? (
        <ul className={`${box} divide-y divide-line`}>
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 py-3">
              <div className="w-40 shrink-0">
                <div className="font-semibold">{formatDate(r.date, locale)}</div>
                <div className="text-[14px] text-muted tnum">{r.time}, {to("party", { count: r.party })}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{r.name}</div>
                <div className="text-[14px] text-muted">{r.phone}, {r.email}</div>
                <div className="text-[14px]">{r.showTitle ? `${to("forShow")}: ${r.showTitle}` : to("dinnerOnly")}{r.note ? `. ${r.note}` : ""}</div>
              </div>
              <Badge tone={tone[r.status]}>{to(`status.${r.status}`)}</Badge>
              <div className="flex gap-2">
                {r.status === "new" && act(r.id, "confirmed", to("confirm"), "primary")}
                {r.status === "confirmed" && act(r.id, "seated", to("seat"), "ghost")}
                {(r.status === "new" || r.status === "confirmed") && act(r.id, "cancelled", to("cancel"), "danger")}
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="text-muted">{to("resEmpty")}</p>}
    </section>
  );
}

/** How a venue adds LiveStage reservations and show tickets to its own website. */
export async function VenueWidget({ venueId, origin }: { venueId: string; origin: string }) {
  const to = await getTranslations("ops.venue");
  const locale = await getLocale();
  const src = `${origin}/${locale}/embed/venue/${venueId}`;
  const code = `<iframe src="${src}" title="Reservations" width="100%" height="760" style="border:0" loading="lazy"></iframe>`;
  return (
    <section className="max-w-3xl">
      <h2 className="h-sub">{to("widgetTitle")}</h2>
      <p className="mt-2 text-muted">{to("widgetText")}</p>
      <div className="mt-5">
        <div className="mb-1.5 text-[13.5px] font-semibold">{to("embedCode")}</div>
        <pre className="overflow-x-auto rounded-lg bg-navy p-4 text-[13px] leading-relaxed text-onnavy"><code>{code}</code></pre>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Link href={`/embed/venue/${venueId}/site`} target="_blank" className={buttonClass("primary", "md")}>{to("preview")}</Link>
        <Link href={`/embed/venue/${venueId}`} target="_blank" className={buttonClass("ghost", "md")}>{to("openWidget")}</Link>
      </div>
    </section>
  );
}
