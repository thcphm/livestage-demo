import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, CITIES, loc, type Locale } from "@/lib/catalog";
import { formatDateRange } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import { isMusic, type ArtistCard as Card } from "@/demo/queries";
import { Badge, Rating } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";
import { QuickView } from "./quick-view";

const categoryName = (id: string, locale: Locale) => loc(CATEGORIES.find((c) => c.id === id)?.name, locale);

/**
 * Artist result, modelled on marketplace listings: photo, name, act · city, rating, verified bookings,
 * starting price, one recent review and a single "Get a quote" action.
 * `row` is the search-results layout; `tile` is the compact grid used on the home page.
 */
export async function ArtistCard({ a, layout = "tile" }: { a: Card; layout?: "row" | "tile" }) {
  const t = await getTranslations("card");
  const locale = (await getLocale()) as Locale;
  const price = formatMoney(a.priceMin, currencyOf(a.region), locale);
  const trip = a.trips[0];
  const name = (
    <QuickView data={a.quick} music={isMusic(a.category)}>
      <Link href={`/artists/${a.slug}`} className="display text-[17px] leading-tight hover:underline decoration-accent decoration-2 underline-offset-4 truncate">{a.name}</Link>
    </QuickView>
  );
  const meta = (
    <div className="text-[14.5px] text-muted truncate">
      {categoryName(a.category, locale)}, {a.genres.slice(0, 2).join(", ")}
    </div>
  );
  const where = a.availability?.travelling ? (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-gold px-2 py-0.5 text-[12.5px] font-semibold text-ink">
      <Icon name="cal" size={12} />{t("inCity", { city: loc(CITIES[a.availability.city].name, locale) })}
    </div>
  ) : trip ? (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-gold px-2 py-0.5 text-[12.5px] font-semibold text-ink">
      <Icon name="cal" size={12} />
      {t("trip", { city: loc(CITIES[trip.city].name, locale), dates: formatDateRange(trip.from, trip.to, locale) })}
    </div>
  ) : null;
  const flags = (
    <div className="absolute left-2 top-2 flex gap-1">
      {a.top && <Badge tone="gold"><Icon name="star" size={11} fill />{t("top")}</Badge>}
      {a.verified && <Badge className="bg-surface text-ink"><Icon name="check" size={12} />{t("verified")}</Badge>}
    </div>
  );

  if (layout === "tile") {
    return (
      // No overflow-hidden on the card itself: the quick view pops out below the name. Raised while hovered so it sits above the next row.
      <article className="group relative min-w-0 hover:z-10 focus-within:z-10">
        <Link href={`/artists/${a.slug}`} className="block relative aspect-[4/5] overflow-hidden rounded-lg bg-surface2">
          <Image src={a.photo} alt="" fill sizes="(min-width: 1024px) 300px, 50vw" className="object-cover" />
          {flags}
          <span className="absolute bottom-2 left-2 rounded-md bg-black/70 px-2 py-0.5 text-[12.5px] font-medium text-white">{loc(CITIES[a.homeCity].name, locale)}</span>
        </Link>
        <div className="pt-3 space-y-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">{name}</div>
          {meta}
          <div className="flex items-center justify-between gap-2 pt-0.5">
            <Rating value={a.rating} count={a.reviewsCount} />
            <span className="text-[14.5px] font-bold tnum">{t("from", { price })}</span>
          </div>
          {where}
        </div>
      </article>
    );
  }

  return (
    <article className="grid grid-cols-[104px_minmax(0,1fr)] sm:grid-cols-[180px_minmax(0,1fr)_auto] gap-4 sm:gap-6 border-b border-line py-5">
      <Link href={`/artists/${a.slug}`} className="group relative block aspect-square overflow-hidden rounded-lg bg-surface2 row-span-2 sm:row-span-1">
        <Image src={a.photo} alt="" fill sizes="180px" className="object-cover" />
        {a.top && <span className="absolute left-1.5 top-1.5"><Badge tone="gold"><Icon name="star" size={11} fill />{t("top")}</Badge></span>}
      </Link>
      <div className="min-w-0 space-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
          {name}
          {a.verified && <Badge tone="ok"><Icon name="check" size={12} />{t("verified")}</Badge>}
        </div>
        <div className="text-sm text-muted truncate">{categoryName(a.category, locale)}, {a.genres.slice(0, 2).join(", ")}. {loc(CITIES[a.homeCity].name, locale)}</div>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <Rating value={a.rating} count={a.reviewsCount} />
          <span className="text-sm text-muted tnum">{t("shows", { count: a.bookingsCount })}</span>
        </div>
        {where}
        {a.review && (
          <p className="hidden sm:block border-l-[3px] border-gold pl-3 text-sm text-muted line-clamp-2">
            “{a.review.text}” <span className="whitespace-nowrap text-ink/70">– {a.review.author}</span>
          </p>
        )}
      </div>
      <div className="col-start-2 sm:col-start-auto flex sm:flex-col items-center sm:items-end justify-between gap-3 sm:text-right">
        <div>
          <div className="text-xs text-muted">{t("from", { price: "" }).trim()}</div>
          <div className="display text-[22px] tnum">{price}</div>
        </div>
        <Link href={{ pathname: "/quote", query: { artist: a.slug } }} className={buttonClass("primary", "sm")}>{t("quote")}</Link>
      </div>
    </article>
  );
}
