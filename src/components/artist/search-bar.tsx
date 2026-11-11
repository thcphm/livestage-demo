import { getLocale, getTranslations } from "next-intl/server";
import { CATEGORIES, CITIES, REGIONS, loc, type Locale, type RegionId } from "@/lib/catalog";
import { inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";

/** Home search: act type, city and date – /artists. A plain GET form, so it works without JavaScript. */
export async function SearchBar({ region, minDate }: { region: RegionId; minDate: string }) {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as Locale;
  const label = "block text-xs text-muted mb-1";
  return (
    <form action={`/${locale}/artists`} method="get" className="grid gap-2 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end rounded-lg border border-line bg-surface p-2 shadow-lg">
      <label className="block px-1">
        <span className={label}>{t("category")}</span>
        <select name="category" className={inputCls} defaultValue="">
          <option value="">{t("anyCategory")}</option>
          {CATEGORIES.map((c) => <option key={c.id} value={c.id}>{loc(c.name, locale)}</option>)}
        </select>
      </label>
      <label className="block px-1">
        <span className={label}>{t("city")}</span>
        <select name="city" className={inputCls} defaultValue={REGIONS[region].cities[0]}>
          <option value="">{t("anyCity")}</option>
          {REGIONS[region].cities.map((c) => <option key={c} value={c}>{loc(CITIES[c].name, locale)}</option>)}
        </select>
      </label>
      <label className="block px-1">
        <span className={label}>{t("date")}</span>
        <input type="date" name="date" min={minDate} className={inputCls} />
      </label>
      <button type="submit" className={buttonClass("primary", "md", "m-1")}>{t("search")}</button>
    </form>
  );
}
