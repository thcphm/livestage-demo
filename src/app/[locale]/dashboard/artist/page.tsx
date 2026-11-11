import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CITIES, REGIONS, loc, type Locale } from "@/lib/catalog";
import { formatDate, formatDateRange, parseYmd } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import { requireRole } from "@/server/auth/session";
import { travelOn } from "@/server/domain/availability";
import { addDays, artistCalendar, bookingsFor, openSlotsFor } from "@/demo/queries";
import { DEMO_TODAY, getStore } from "@/demo/store";
import { acceptSlot, addSong, addTrip, removeTrip, toggleBlockedDate, toggleSignature } from "@/demo/actions";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { BookingList } from "@/components/dashboard/booking-list";
import { DashShell, pickTab, type DashTab } from "@/components/dashboard/dash-shell";
import { SubmitButton } from "@/components/ui/submit-button";

const DOW = { vi: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"], en: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] };

export default async function ArtistDashboard({ searchParams }: { searchParams: Promise<{ tab?: string; month?: string }> }) {
  const user = await requireRole("artist", "/dashboard/artist");
  const t = await getTranslations("dash");
  const tb = await getTranslations("booking");
  const tq = await getTranslations("quote");
  const locale = (await getLocale()) as Locale;
  const sp = await searchParams;
  const artist = getStore().artists.find((a) => a.id === user.entityId)!;
  const rows = bookingsFor(user).filter((r) => !r.id.startsWith("p-"));
  const requests = rows.filter((r) => r.status === "new" || r.status === "quoted");
  const opps = openSlotsFor(artist.id);
  const tabs: DashTab[] = [
    { key: "overview", label: t("tabs.overview"), count: requests.filter((r) => r.status === "new").length },
    { key: "calendar", label: t("tabs.calendar") },
    { key: "trips", label: t("tabs.trips") },
    { key: "songs", label: t("tabs.songs") },
    { key: "opps", label: t("tabs.opps"), count: opps.length },
    { key: "bookings", label: t("tabs.bookings") },
  ];
  const active = pickTab(tabs, sp.tab);
  const city = (c: keyof typeof CITIES) => loc(CITIES[c].name, locale);
  const h2 = "font-semibold mb-3";

  return (
    <DashShell
      title={user.displayName}
      sub={t("sub.artist", { city: city(artist.homeCity) })}
      avatar={<Avatar name={user.displayName} src={user.photo} size={52} />}
      action={<Link href={`/artists/${artist.slug}`} className={buttonClass("ghost", "md")}>{t("openProfile")}</Link>}
      tabs={tabs}
      active={active.key}
      basePath="/dashboard/artist"
    >
      {active.key === "overview" && (
        <>
          <section><h2 className={h2}>{t("action")}</h2><BookingList rows={requests} /></section>
          <section><h2 className={h2}>{t("upcoming")}</h2><BookingList rows={rows.filter((r) => r.status === "confirmed" && r.date >= DEMO_TODAY)} /></section>
        </>
      )}

      {active.key === "calendar" && <Calendar artistId={artist.id} month={sp.month} />}

      {active.key === "trips" && (
        <section className="max-w-3xl">
          <p className="text-sm text-muted mb-4">{t("tripsHint")}</p>
          {artist.travel.length ? (
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface mb-6">
              {artist.travel.map((w) => (
                <li key={w.from} className="flex items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{city(artist.homeCity)} – {city(w.city)}, {formatDateRange(w.from, w.to, locale)}</div>
                    {loc(w.note, locale) && <div className="text-sm text-muted">{loc(w.note, locale)}</div>}
                  </div>
                  <form action={removeTrip}><input type="hidden" name="from" value={w.from} /><SubmitButton className={buttonClass("ghost", "sm")}>{t("remove")}</SubmitButton></form>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted mb-6">{t("noTrips")}</p>}
          <form action={addTrip} className="grid sm:grid-cols-[repeat(3,minmax(0,1fr))] gap-3 rounded-xl border border-line bg-surface p-4">
            <Field label={t("tripFrom")}><input type="date" name="from" min={DEMO_TODAY} required className={inputCls} /></Field>
            <Field label={t("tripTo")}><input type="date" name="to" min={DEMO_TODAY} required className={inputCls} /></Field>
            <Field label={t("tripCity")}>
              <select name="city" className={inputCls}>
                {REGIONS[artist.region].cities.filter((c) => c !== artist.homeCity).map((c) => <option key={c} value={c}>{city(c)}</option>)}
              </select>
            </Field>
            <div className="sm:col-span-2"><Field label={t("tripNote")}><input name="note" placeholder={t("tripNotePlaceholder")} className={inputCls} /></Field></div>
            <div className="flex items-end"><SubmitButton className={buttonClass("primary", "md", "w-full")}>{t("addTrip")}</SubmitButton></div>
          </form>
        </section>
      )}

      {active.key === "songs" && (
        <section className="max-w-3xl">
          <p className="text-sm text-muted mb-4">{t("songsHint")}</p>
          <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
            {artist.repertoire.map((s) => (
              <li key={s.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                <span className="flex-1 min-w-0 truncate"><span className="font-medium">{s.title}</span> <span className="text-muted">· {s.original}</span></span>
                <form action={toggleSignature}>
                  <input type="hidden" name="song" value={s.id} />
                  <SubmitButton aria-pressed={s.signature} className={`rounded-md px-2 py-1 text-xs ${s.signature ? "bg-warnsoft text-warn font-medium" : "text-muted hover:bg-surface2"}`}>★ {t("signature")}</SubmitButton>
                </form>
              </li>
            ))}
          </ul>
          <form action={addSong} className="mt-4 flex flex-wrap gap-2">
            <input name="title" required placeholder={tq("songTitle")} aria-label={tq("songTitle")} className={`${inputCls} flex-1 min-w-40`} />
            <input name="original" placeholder={tq("songOriginal")} aria-label={tq("songOriginal")} className={`${inputCls} flex-1 min-w-40`} />
            <SubmitButton className={buttonClass("primary", "md")}>{t("addSong")}</SubmitButton>
          </form>
        </section>
      )}

      {active.key === "opps" && (
        <section>
          <p className="text-sm text-muted mb-4">{t("oppsHint")}</p>
          {opps.length ? (
            <ul className="divide-y divide-line rounded-xl border border-line bg-surface">
              {opps.map((o) => (
                <li key={o.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{o.title}, {o.venue}</div>
                    <div className="text-sm text-muted">{formatDate(o.date, locale)}, {o.start}, {city(o.city)}</div>
                  </div>
                  <span className="text-sm tnum">{formatMoney(o.fee, currencyOf(artist.region), locale)}</span>
                  <form action={acceptSlot}><input type="hidden" name="booking" value={o.id} /><SubmitButton className={buttonClass("primary", "sm")}>{tb("acceptSlot")}</SubmitButton></form>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-muted">{t("noOpps")}</p>}
        </section>
      )}

      {active.key === "bookings" && <BookingList rows={rows} />}
    </DashShell>
  );
}

/** Month grid: public shows, private events, private busy days (click to toggle) and trips (R2, R3). */
async function Calendar({ artistId, month }: { artistId: string; month?: string }) {
  const t = await getTranslations("dash");
  const locale = (await getLocale()) as Locale;
  const cal = artistCalendar(artistId);
  const ym = month && /^\d{4}-\d{2}$/.test(month) ? month : DEMO_TODAY.slice(0, 7);
  const first = `${ym}-01`;
  const start = addDays(first, -((parseYmd(first).getUTCDay() + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(start, i));
  const shift = (n: number) => {
    const d = parseYmd(first);
    d.setUTCMonth(d.getUTCMonth() + n);
    return d.toISOString().slice(0, 7);
  };
  const title = parseYmd(first).toLocaleDateString(locale === "vi" ? "vi-VN" : "en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  const dot = "inline-block h-2.5 w-2.5 rounded-sm";

  return (
    <section>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <Link href={{ pathname: "/dashboard/artist", query: { tab: "calendar", month: shift(-1) } }} className={buttonClass("ghost", "sm")} aria-label={t("prev")}>←</Link>
          <h2 className="font-semibold min-w-36 text-center capitalize">{title}</h2>
          <Link href={{ pathname: "/dashboard/artist", query: { tab: "calendar", month: shift(1) } }} className={buttonClass("ghost", "sm")} aria-label={t("next")}>→</Link>
        </div>
        <div className="flex flex-wrap gap-3 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className={`${dot} bg-ink`} />{t("legend.public")}</span>
          <span className="flex items-center gap-1.5"><span className={`${dot} bg-info`} />{t("legend.private")}</span>
          <span className="flex items-center gap-1.5"><span className={`${dot} bg-surface2 border border-line`} />{t("legend.blocked")}</span>
          <span className="flex items-center gap-1.5"><span className={`${dot} bg-accent`} />{t("legend.trip")}</span>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line text-sm">
        {DOW[locale].map((d) => <div key={d} className="bg-surface px-2 py-1.5 text-xs text-muted">{d}</div>)}
        {days.map((d) => {
          const inMonth = d.startsWith(ym);
          const bookings = cal.bookings.filter((b) => b.date === d);
          const blocked = cal.blocked.includes(d);
          const trip = travelOn({ travel: cal.travel }, d);
          const past = d < DEMO_TODAY;
          const body = (
            <>
              <div className="flex items-center justify-between">
                <span className={`tnum ${d === DEMO_TODAY ? "font-semibold text-accent" : ""}`}>{Number(d.slice(8))}</span>
                {trip && <span className="truncate text-[11px] text-accent">{loc(CITIES[trip.city].name, locale)}</span>}
              </div>
              {bookings.map((b) => (
                <div key={b.id} className={`mt-1 truncate rounded px-1 py-0.5 text-[11px] ${b.isPublic ? "bg-ink text-bg" : "bg-info text-bg"}`}>
                  {b.start} {b.title}
                </div>
              ))}
              {blocked && !bookings.length && <div className="mt-1 text-[11px] text-muted">—</div>}
            </>
          );
          const cls = `min-h-[72px] px-1.5 py-1 text-left align-top ${inMonth ? "" : "opacity-40"} ${blocked ? "bg-surface2 [background-image:repeating-linear-gradient(135deg,transparent_0_6px,var(--line)_6px_7px)]" : "bg-surface"} ${trip ? "shadow-[inset_0_2px_0_var(--accent)]" : ""}`;
          return bookings.length || past ? (
            bookings.length
              ? <Link key={d} href={`/dashboard/bookings/${bookings[0].id}`} className={`${cls} hover:bg-surface2`}>{body}</Link>
              : <div key={d} className={cls}>{body}</div>
          ) : (
            <form key={d} action={toggleBlockedDate} className="contents">
              <input type="hidden" name="date" value={d} />
              <SubmitButton className={`${cls} hover:bg-surface2`}>{body}</SubmitButton>
            </form>
          );
        })}
      </div>
      <p className="mt-3 text-sm text-muted">{t("calendarHint")}</p>
      <p className="mt-1 text-sm text-muted">{t("publicNote")}</p>
    </section>
  );
}
