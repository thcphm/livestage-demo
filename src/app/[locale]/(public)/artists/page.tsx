import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, CITIES, REGIONS, loc, type CategoryId, type CityId, type Locale } from "@/lib/catalog";
import { getRegion } from "@/lib/region";
import { searchArtists, type ArtistSearch } from "@/demo/queries";
import { DEMO_TODAY } from "@/demo/store";
import { ArtistCard } from "@/components/artist/artist-card";
import { inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";

type Params = { category?: string; city?: string; date?: string; budget?: string; q?: string; sort?: string };

export default async function ArtistsPage({ searchParams }: { searchParams: Promise<Params> }) {
  const t = await getTranslations("search");
  const th = await getTranslations("home");
  const locale = (await getLocale()) as Locale;
  const region = await getRegion();
  const p = await searchParams;
  const r = REGIONS[region];

  const category = CATEGORIES.some((c) => c.id === p.category) ? (p.category as CategoryId) : undefined;
  const city = r.cities.includes(p.city as CityId) ? (p.city as CityId) : undefined;
  const date = p.date && /^\d{4}-\d{2}-\d{2}$/.test(p.date) && p.date >= DEMO_TODAY ? p.date : undefined;
  const budgetIdx = p.budget !== undefined && p.budget !== "" ? Number(p.budget) : NaN;
  const budgetMax = Number.isInteger(budgetIdx) ? r.budgetCaps[budgetIdx] ?? undefined : undefined;
  const sort = (["recommended", "price", "rating"] as const).find((s) => s === p.sort) ?? "recommended";
  const filters: ArtistSearch = { region, category, city, date, budgetMax, q: p.q?.trim() || undefined, sort };
  const results = searchArtists(filters);
  const label = "block text-xs text-muted mb-1";

  return (
    <div>
      <section className="bg-navy text-white">
        <div className="wrap pt-10 pb-16">
          <h1 className="h-page">{t("title", { region: loc(r.name, locale) })}</h1>
          {date && <p className="mt-2 max-w-2xl text-onnavymuted">{t("dateHint")}</p>}
        </div>
      </section>
      <div className="wrap -mt-10">
      <form action={`/${locale}/artists`} method="get" className="rounded-xl bg-surface p-4 shadow-lift grid gap-3 grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(4,minmax(0,1fr))_auto] lg:items-end">
        <label className="col-span-2 lg:col-span-1">
          <span className={label}>{t("q")}</span>
          <input name="q" defaultValue={p.q} placeholder={t("qPlaceholder")} className={inputCls} />
        </label>
        <label>
          <span className={label}>{th("category")}</span>
          <select name="category" defaultValue={category ?? ""} className={inputCls}>
            <option value="">{th("anyCategory")}</option>
            {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{loc(c.name, locale)}</option>)}
          </select>
        </label>
        <label>
          <span className={label}>{th("city")}</span>
          <select name="city" defaultValue={city ?? ""} className={inputCls}>
            <option value="">{th("anyCity")}</option>
            {r.cities.map((c) => <option key={c} value={c}>{loc(CITIES[c].name, locale)}</option>)}
          </select>
        </label>
        <label>
          <span className={label}>{th("date")}</span>
          <input type="date" name="date" min={DEMO_TODAY} defaultValue={date} className={inputCls} />
        </label>
        <label>
          <span className={label}>{t("budget")}</span>
          <select name="budget" defaultValue={Number.isInteger(budgetIdx) ? String(budgetIdx) : ""} className={inputCls}>
            <option value="">{t("anyBudget")}</option>
            {r.budgets.map((b, i) => <option key={i} value={i}>{loc(b, locale)}</option>)}
          </select>
        </label>
        <div className="col-span-2 lg:col-span-1 flex gap-2">
          <button type="submit" className={buttonClass("primary", "md", "flex-1 lg:flex-none")}>{t("apply")}</button>
          <Link href="/artists" className={buttonClass("ghost", "md")}>{t("clear")}</Link>
        </div>
        <input type="hidden" name="sort" value={sort} />
      </form>

      <div className="mt-6 flex items-center justify-between gap-3 border-b border-line pb-3">
        <span className="text-sm text-muted">{t("results", { count: results.length })}</span>
        <div className="flex gap-1 text-sm">
          {(["recommended", "price", "rating"] as const).map((s) => (
            <Link key={s} href={{ pathname: "/artists", query: { ...p, sort: s } }}
              className={`rounded-md px-2.5 py-1 ${sort === s ? "bg-accentsoft font-semibold text-accentink" : "text-muted hover:text-ink"}`}>
              {t(s === "recommended" ? "sortRecommended" : s === "price" ? "sortPrice" : "sortRating")}
            </Link>
          ))}
        </div>
      </div>

      {results.length ? (
        <div className="mt-4 space-y-3">{results.map((a) => <ArtistCard key={a.id} a={a} layout="row" />)}</div>
      ) : (
        <p className="mt-10 text-center text-muted">{t("empty")}</p>
      )}
      </div>
    </div>
  );
}
