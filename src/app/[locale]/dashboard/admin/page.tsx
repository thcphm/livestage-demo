import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, CITIES, REGIONS, loc, type Locale, type RegionId } from "@/lib/catalog";
import { currencyOf, formatMoney, toMajor } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { requireRole } from "@/server/auth/session";
import { formatBps, type PlatformRates } from "@/server/domain/fees";
import { adminArtists, adminTotals, allLeads, bookingsFor, getRates, platformIncome, staffList } from "@/demo/queries";
import { getStore } from "@/demo/store";
import { resetDemoData, setArtistFee, setRates } from "@/demo/actions";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { BookingList } from "@/components/dashboard/booking-list";
import { DashShell, pickTab, type DashTab } from "@/components/dashboard/dash-shell";
import { SubmitButton } from "@/components/ui/submit-button";

const RATE_KEYS: (keyof PlatformRates)[] = ["artistBps", "venueBps", "customerBps", "cardBps", "comboBps"];
const table = "w-full text-[14.5px]";
const th = "px-4 py-2 font-normal";

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireRole("admin", "/dashboard/admin");
  const t = await getTranslations("dash");
  const to = await getTranslations("ops.admin");
  const tr = await getTranslations("ops.recruit");
  const locale = (await getLocale()) as Locale;
  const region = await getRegion();
  const cur = currencyOf(region);
  const money = (n: number) => formatMoney(n, cur, locale);
  const rows = bookingsFor(user, { region });
  const totals = adminTotals(region);
  const isSuper = user.staff?.level === "super";
  const tabs: DashTab[] = [
    { key: "overview", label: t("tabs.overview"), count: totals.flagged },
    { key: "bookings", label: t("tabs.bookings") },
    { key: "rates", label: to("tabs.rates") },
    { key: "artists", label: t("tabs.artists") },
    { key: "tickets", label: t("tabs.tickets") },
    { key: "recruitment", label: to("tabs.recruitment") },
    { key: "team", label: to("tabs.team") },
  ];
  const active = pickTab(tabs, (await searchParams).tab);
  const h2 = "display text-[18px] mb-3";
  const stat = (label: string, value: string | number) => (
    <div key={label} className="border-t border-ink/20 pt-2">
      <div className="text-[13.5px] text-muted">{label}</div>
      <div className="display text-[26px] tnum">{value}</div>
    </div>
  );

  return (
    <DashShell
      title={user.displayName}
      sub={`${to(`level.${user.staff?.level ?? "super"}`)}, Olive. ${loc(REGIONS[region].name, locale)}`}
      avatar={<Avatar name={user.displayName} hue={user.hue} size={52} square />}
      tabs={tabs}
      active={active.key}
      basePath="/dashboard/admin"
    >
      {active.key === "overview" && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-x-6 gap-y-5">
            {stat(t("totals.active"), totals.active)}
            {stat(t("totals.confirmed"), totals.confirmed)}
            {stat(t("totals.flagged"), totals.flagged)}
            {stat(t("totals.gmv"), money(totals.gmv))}
            {stat(t("totals.fees"), money(totals.fees))}
          </div>
          <Income region={region} />
          <section><h2 className={h2}>{t("totals.flagged")}</h2><BookingList rows={rows.filter((r) => r.flagged)} /></section>
          <section><h2 className={h2}>{t("totals.active")}</h2><BookingList rows={rows.filter((r) => ["new", "quoted", "pending_payment"].includes(r.status))} /></section>
        </>
      )}

      {active.key === "bookings" && <BookingList rows={rows} />}

      {active.key === "rates" && (
        <>
          <section className="max-w-3xl">
            <h2 className={h2}>{to("ratesTitle")}</h2>
            <p className="mb-4 text-muted">{to("ratesHint")}</p>
            {!isSuper && <p className="mb-4 flex items-center gap-2 rounded-md bg-surface2 px-3 py-2 text-[14.5px]"><Icon name="lock" size={15} />{to("readOnly")}</p>}
            <form action={setRates} className="divide-y divide-line rounded-lg border border-line">
              {RATE_KEYS.map((k) => (
                <label key={k} className="flex items-center gap-4 px-4 py-3">
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{to(`rate.${k}`)}</span>
                    <span className="block text-[13.5px] text-muted">{to(`rateHint.${k}`)}</span>
                  </span>
                  <input name={k} type="number" step="0.1" min={0} max={50} defaultValue={getRates()[k] / 100} disabled={!isSuper} className={`${inputCls} w-24! shrink-0 text-right tnum disabled:bg-surface2`} />
                  <span className="text-muted">%</span>
                </label>
              ))}
              {isSuper && <div className="px-4 py-3"><SubmitButton className={buttonClass("primary", "md")}>{t("save")}</SubmitButton></div>}
            </form>
          </section>
          <Income region={region} />
        </>
      )}

      {active.key === "artists" && (
        <section>
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="display text-[18px]">{t("feeTitle")}</h2>
            <p className="text-[14.5px] text-muted">{t("feeHint")}</p>
          </div>
          <div className="relative overflow-x-auto rounded-lg border border-line bg-surface">
            <table className={table}>
              <thead className="text-left text-[13px] text-muted border-b border-line">
                <tr>
                  <th className={th}>{t("tabs.artists")}</th>
                  <th className={`${th} hidden md:table-cell`}>{t("upcoming")}</th>
                  <th className={th}>{t("feeTitle")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {adminArtists(region).map((a) => (
                  <tr key={a.id}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={a.name} src={a.photo} size={32} />
                        <div className="min-w-0">
                          <Link href={`/artists/${a.slug}`} className="font-semibold hover:underline underline-offset-2">{a.name}</Link>
                          <div className="text-[13px] text-muted truncate">
                            {loc(CATEGORIES.find((c) => c.id === a.category)?.name, locale)}, {loc(CITIES[a.homeCity].name, locale)}. {a.phone}
                          </div>
                          {a.internalNote && <div className="text-[13px] text-muted truncate">{a.internalNote}</div>}
                        </div>
                        {a.verified && <Badge tone="ok"><Icon name="check" size={12} /></Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 hidden md:table-cell text-muted">{t("upcomingCount", { count: a.upcoming })}</td>
                    <td className="px-4 py-2.5">
                      <form action={setArtistFee} className="flex items-center gap-2">
                        <input type="hidden" name="artist" value={a.id} />
                        <label className="sr-only" htmlFor={`pct-${a.id}`}>{t("feePct")}</label>
                        <input id={`pct-${a.id}`} name="pct" type="number" step="0.5" min={0} max={50} defaultValue={a.fee.bps / 100} disabled={!isSuper} className={`${inputCls} w-20! h-9! disabled:bg-surface2`} />
                        <span className="text-muted">%</span>
                        <label className="sr-only" htmlFor={`min-${a.id}`}>{t("feeMin")}</label>
                        <input id={`min-${a.id}`} name="min" type="number" min={0} defaultValue={toMajor(a.fee.minimum, cur)} placeholder={t("feeMin")} disabled={!isSuper} className={`${inputCls} w-24! h-9! disabled:bg-surface2`} />
                        {isSuper && <SubmitButton className={buttonClass("ghost", "sm")}>{t("save")}</SubmitButton>}
                        <span className="hidden lg:inline text-[13px] text-muted tnum">{formatBps(a.fee.bps)}{a.fee.minimum ? `, min ${money(a.fee.minimum)}` : ""}</span>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {active.key === "tickets" && <AdminTickets region={region} />}

      {active.key === "recruitment" && (
        <section>
          <h2 className={h2}>{to("tabs.recruitment")}</h2>
          <div className="relative overflow-x-auto rounded-lg border border-line bg-surface">
            <table className={table}>
              <thead className="text-left text-[13px] text-muted border-b border-line">
                <tr><th className={th}>{tr("name")}</th><th className={th}>{tr("kindLabel")}</th><th className={th}>{to("owner")}</th><th className={th}>{tr("statusLabel")}</th></tr>
              </thead>
              <tbody className="divide-y divide-line">
                {allLeads(region).map((l) => (
                  <tr key={l.id}>
                    <td className="px-4 py-2.5"><div className="font-semibold">{l.name}</div><div className="text-[13px] text-muted">{loc(CITIES[l.city].name, locale)}. {l.contact}</div></td>
                    <td className="px-4 py-2.5">{tr(`kind.${l.kind}`)}{l.kind === "agency" ? `, ${tr("represents", { count: l.size })}` : ""}</td>
                    <td className="px-4 py-2.5">{l.owner}</td>
                    <td className="px-4 py-2.5"><Badge tone={l.status === "signed" ? "ok" : l.status === "lost" ? "bad" : l.status === "negotiating" ? "warn" : "neutral"}>{tr(`status.${l.status}`)}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {active.key === "team" && (
        <section>
          <h2 className={h2}>{to("tabs.team")}</h2>
          <p className="mb-4 max-w-2xl text-muted">{to("teamHint")}</p>
          <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
            {staffList().map((s) => {
              const store = getStore();
              const names = s.roster.map((id) => store.artists.find((a) => a.id === id)?.name).filter(Boolean).join(", ");
              return (
                <li key={s.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
                  <Avatar name={s.name} hue={s.hue} size={40} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold">{s.name} <span className="font-normal text-muted">{s.org}</span></div>
                    <div className="text-[14px] text-muted">{to(`perms.${s.level}`)}{names ? ` ${to("roster", { names })}` : ""}</div>
                  </div>
                  {s.region && <span className="text-[14px] text-muted">{loc(REGIONS[s.region].name, locale)}</span>}
                  <Badge tone={s.level === "super" ? "gold" : "neutral"}>{to(`level.${s.level}`)}</Badge>
                </li>
              );
            })}
          </ul>
          {isSuper && (
            <form action={resetDemoData} className="mt-8 max-w-2xl border-t border-line pt-5">
              <h2 className={h2}>{to("resetTitle")}</h2>
              <p className="mb-3 text-muted">{to("resetHint")}</p>
              <SubmitButton className={buttonClass("ghost", "md")}>{to("reset")}</SubmitButton>
            </form>
          )}
        </section>
      )}
    </DashShell>
  );
}

/** Olive's income by source: artists, venues, customers and the card surcharge. */
async function Income({ region }: { region: RegionId }) {
  const to = await getTranslations("ops.admin");
  const locale = (await getLocale()) as Locale;
  const money = (n: number) => formatMoney(n, currencyOf(region), locale);
  const i = platformIncome(region);
  const total = i.fromArtists + i.fromVenues + i.fromCustomers + i.cardSurcharge;
  const rows: [string, number][] = [[to("fromArtists"), i.fromArtists], [to("fromVenues"), i.fromVenues], [to("fromCustomers"), i.fromCustomers], [to("cardSurcharge"), i.cardSurcharge]];
  return (
    <section className="max-w-3xl">
      <h2 className="display text-[18px] mb-3">{to("income")}</h2>
      <dl className="divide-y divide-line rounded-lg border border-line">
        {rows.map(([label, n]) => (
          <div key={label} className="flex items-center gap-4 px-4 py-2.5">
            <dt className="w-56 shrink-0 text-[14.5px]">{label}</dt>
            <dd className="flex min-w-0 flex-1 items-center gap-3">
              <span className="h-2 rounded-full bg-accent" style={{ width: `${total ? Math.max(2, Math.round((n / total) * 100)) : 2}%` }} />
              <span className="tnum font-semibold">{money(n)}</span>
            </dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between bg-surface2 px-4 py-2.5">
          <dt className="font-semibold">{to("incomeTotal")}</dt>
          <dd className="display text-[22px] tnum">{money(total)}</dd>
        </div>
      </dl>
      <p className="mt-2 text-[13.5px] text-muted">{to("incomeNote", { revenue: money(i.ticketRevenue), combos: i.comboTickets })}</p>
    </section>
  );
}

async function AdminTickets({ region }: { region: RegionId }) {
  const t = await getTranslations("dash");
  const tt = await getTranslations("ops.ticket");
  const locale = (await getLocale()) as Locale;
  const s = getStore();
  const list = s.tickets.filter((x) => s.bookings.find((b) => b.id === x.bookingId)?.region === region);
  return (
    <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
      {list.map((x) => {
        const b = s.bookings.find((y) => y.id === x.bookingId)!;
        return (
          <li key={x.id} className="flex items-center gap-3 px-4 py-2.5 text-[14.5px]">
            <span className="font-mono w-28">{x.code}</span>
            <span className="min-w-0 flex-1 truncate">{x.name}, {b.title}</span>
            {x.kind === "combo" && <Badge tone="gold">{tt("combo")}</Badge>}
            <span className="tnum text-muted">{formatMoney(x.total, currencyOf(region), locale)}</span>
            {x.checkedIn && <Badge tone="ok">{t("checkedIn")}</Badge>}
          </li>
        );
      })}
    </ul>
  );
}
