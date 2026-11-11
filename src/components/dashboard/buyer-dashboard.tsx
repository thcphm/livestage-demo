import { headers } from "next/headers";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, CITIES, loc, type Locale } from "@/lib/catalog";
import { currencyOf } from "@/lib/money";
import type { SessionUser } from "@/server/auth/session";
import { bookingsFor } from "@/demo/queries";
import { DEMO_TODAY } from "@/demo/store";
import { createSlot } from "@/demo/actions";
import { Avatar } from "@/components/ui/avatar";
import { Field, inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { BookingList } from "./booking-list";
import { VenueReservations, VenueShows, VenueWidget } from "./venue-ops";
import { DashShell, pickTab, type DashTab } from "./dash-shell";
import { SubmitButton } from "@/components/ui/submit-button";

/** Venue and individual-client dashboards share the booking views; venues also sell tickets and open slots. */
export async function BuyerDashboard({ user, tab }: { user: SessionUser; tab?: string }) {
  const t = await getTranslations("dash");
  const tq = await getTranslations("quote");
  const to = await getTranslations("ops.venue");
  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  const locale = (await getLocale()) as Locale;
  const isVenue = user.role === "venue";
  const rows = bookingsFor(user);
  const needsAction = rows.filter((r) => r.status === "quoted" || r.status === "pending_payment");
  const upcoming = rows.filter((r) => r.status === "confirmed" && r.date >= DEMO_TODAY);
  const tabs: DashTab[] = [
    { key: "overview", label: t("tabs.overview"), count: needsAction.length },
    { key: "bookings", label: t("tabs.bookings") },
    ...(isVenue ? [{ key: "shows", label: t("tabs.shows") }, { key: "reservations", label: to("tabs.reservations") }, { key: "widget", label: to("tabs.widget") }, { key: "slot", label: t("tabs.slot") }] : []),
  ];
  const active = pickTab(tabs, tab);
  const basePath = isVenue ? "/dashboard/venue" : "/dashboard/client";
  const h2 = "font-semibold mb-3";

  return (
    <DashShell
      title={user.displayName}
      sub={t(`sub.${isVenue ? "venue" : "client"}`, { city: user.city ? loc(CITIES[user.city].name, locale) : "—" })}
      avatar={<Avatar name={user.displayName} src={user.photo} hue={user.hue} size={52} square={isVenue} />}
      action={<Link href="/quote" className={buttonClass("primary", "md")}>{t("newRequest")}</Link>}
      tabs={tabs}
      active={active.key}
      basePath={basePath}
    >
      {active.key === "overview" && (
        <>
          <section><h2 className={h2}>{t("action")}</h2><BookingList rows={needsAction} /></section>
          <section><h2 className={h2}>{t("upcoming")}</h2><BookingList rows={upcoming} /></section>
        </>
      )}
      {active.key === "bookings" && <BookingList rows={rows.filter((r) => !r.id.startsWith("p-"))} />}
      {active.key === "shows" && isVenue && <VenueShows venueId={user.entityId!} />}
      {active.key === "reservations" && isVenue && <VenueReservations venueId={user.entityId!} />}
      {active.key === "widget" && isVenue && <VenueWidget venueId={user.entityId!} origin={origin} />}
      {active.key === "slot" && isVenue && (
        <section className="max-w-2xl">
          <p className="text-sm text-muted mb-4">{t("slotHint")}</p>
          <form action={createSlot} className="grid sm:grid-cols-2 gap-4 rounded-lg border border-line bg-surface p-4">
            <div className="sm:col-span-2"><Field label={t("slotTitle")}><input name="title" required className={inputCls} /></Field></div>
            <Field label={tq("date")}><input name="date" type="date" min={DEMO_TODAY} required className={inputCls} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={tq("start")}><input name="start" type="time" defaultValue="20:00" className={inputCls} /></Field>
              <Field label={tq("duration")}><input name="duration" type="number" min={1} max={5} defaultValue={2} className={inputCls} /></Field>
            </div>
            <Field label={tq("category")}>
              <select name="category" className={inputCls}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{loc(c.name, locale)}</option>)}</select>
            </Field>
            <Field label={`${t("slotFee")} (${currencyOf(user.region!)})`}><input name="fee" type="number" min={1} required className={inputCls} /></Field>
            <label className="sm:col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" name="ticketing" className="h-4 w-4 accent-[var(--ink)]" />{t("ticketing")}</label>
            <Field label={`${t("ticketPrice")} (${currencyOf(user.region!)})`}><input name="ticketPrice" type="number" min={0} className={inputCls} /></Field>
            <Field label={t("capacity")}><input name="capacity" type="number" min={1} defaultValue={60} className={inputCls} /></Field>
            <div className="sm:col-span-2"><SubmitButton className={buttonClass("primary", "md")}>{t("createSlot")}</SubmitButton></div>
          </form>
        </section>
      )}
    </DashShell>
  );
}
