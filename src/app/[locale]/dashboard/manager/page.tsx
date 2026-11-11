import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, CITIES, loc, type Locale } from "@/lib/catalog";
import { formatDate, formatDateRange } from "@/lib/dates";
import { requireRole } from "@/server/auth/session";
import { bookingsFor, managerRoster } from "@/demo/queries";
import { Avatar } from "@/components/ui/avatar";
import { Rating } from "@/components/ui/badge";
import { BookingList } from "@/components/dashboard/booking-list";
import { DashShell, pickTab, type DashTab } from "@/components/dashboard/dash-shell";

/**
 * Artist manager (an agency or a manager with several artists): one account that acts for every
 * artist on its roster – answers requests, sends quotes, agrees contracts and messages clients.
 */
export default async function ManagerDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireRole("manager", "/dashboard/manager");
  const t = await getTranslations("ops.manager");
  const td = await getTranslations("dash");
  const locale = (await getLocale()) as Locale;
  const roster = managerRoster(user);
  const rows = bookingsFor(user).filter((r) => !r.id.startsWith("p-"));
  const needs = rows.filter((r) => ["new", "quoted", "pending_payment"].includes(r.status));
  const tabs: DashTab[] = [{ key: "roster", label: t("roster") }, { key: "requests", label: t("requests"), count: needs.length }, { key: "bookings", label: td("tabs.bookings") }];
  const active = pickTab(tabs, (await searchParams).tab);

  return (
    <DashShell
      title={user.displayName}
      sub={t("sub", { org: user.staff?.org ?? "" })}
      avatar={<Avatar name={user.displayName} hue={user.hue} size={52} />}
      tabs={tabs}
      active={active.key}
      basePath="/dashboard/manager"
    >
      {active.key === "roster" && (
        <>
          <p className="max-w-2xl text-muted">{t("hint")}</p>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {roster.map((a) => (
              <li key={a.id}>
                <Link href={`/artists/${a.slug}`} className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface2">
                  <Image src={a.photo} alt="" fill sizes="(min-width: 1024px) 380px, 50vw" className="object-cover" />
                </Link>
                <div className="pt-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="display text-[19px] leading-tight">{a.name}</span>
                    <Rating value={a.rating} />
                  </div>
                  <div className="text-[14.5px] text-muted">{loc(CATEGORIES.find((c) => c.id === a.category)?.name, locale)}, {loc(CITIES[a.homeCity].name, locale)}</div>
                  <dl className="mt-3 grid grid-cols-3 border-y border-line text-center">
                    {([[t("pending"), a.pending], [t("quoted"), a.quoted], [t("upcoming"), a.upcoming]] as const).map(([label, n]) => (
                      <div key={label} className="py-2">
                        <dd className={`display text-[22px] tnum ${n && label === t("pending") ? "bg-gold" : ""}`}>{n}</dd>
                        <dt className="text-[13px] text-muted">{label}</dt>
                      </div>
                    ))}
                  </dl>
                  <div className="mt-2 text-[14px] text-muted">
                    {a.nextShow ? t("next", { date: formatDate(a.nextShow, locale) }) : t("noNext")}
                    {a.trips[0] && <span className="block">{t("trip", { city: loc(CITIES[a.trips[0].city].name, locale), dates: formatDateRange(a.trips[0].from, a.trips[0].to, locale) })}</span>}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
      {active.key === "requests" && <BookingList rows={needs} empty={t("none")} />}
      {active.key === "bookings" && <BookingList rows={rows} />}
    </DashShell>
  );
}
