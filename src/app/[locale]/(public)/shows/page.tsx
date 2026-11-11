import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CITIES, REGIONS, loc, type CityId, type Locale } from "@/lib/catalog";
import { getRegion } from "@/lib/region";
import { listShows } from "@/demo/queries";
import { ShowCard } from "@/components/show/show-card";

export default async function ShowsPage({ searchParams }: { searchParams: Promise<{ city?: string }> }) {
  const t = await getTranslations("shows");
  const locale = (await getLocale()) as Locale;
  const region = await getRegion();
  const { city: raw } = await searchParams;
  const city = REGIONS[region].cities.includes(raw as CityId) ? (raw as CityId) : undefined;
  const shows = listShows(region, city);
  const withShows = new Set(listShows(region).map((s) => s.city));
  const chip = (active: boolean) => `rounded-md px-2.5 py-1 text-sm whitespace-nowrap ${active ? "bg-accent text-onaccent font-semibold" : "bg-surface text-ink/80 shadow-card hover:text-accent"}`;

  return (
    <div>
      <section className="bg-navy text-white">
        <div className="wrap py-10">
          <h1 className="h-page">{t("title")}</h1>
          <p className="mt-1 text-onnavymuted">{t("sub", { region: loc(REGIONS[region].name, locale) })}</p>
        </div>
      </section>
      <div className="wrap">
      <nav className="mt-6 flex gap-1.5 overflow-x-auto [scrollbar-width:none]">
        <Link href="/shows" className={chip(!city)}>{t("allCities")}</Link>
        {REGIONS[region].cities.filter((c) => withShows.has(c)).map((c) => (
          <Link key={c} href={{ pathname: "/shows", query: { city: c } }} className={chip(city === c)}>{loc(CITIES[c].name, locale)}</Link>
        ))}
      </nav>
      {shows.length ? (
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">{shows.map((s) => <ShowCard key={s.id} s={s} />)}</div>
      ) : <p className="mt-10 text-center text-muted">{t("empty")}</p>}
      </div>
    </div>
  );
}
