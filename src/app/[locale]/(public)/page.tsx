import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, CITIES, EVENT_TYPES, loc, type CategoryId, type Locale } from "@/lib/catalog";
import { formatDateRange } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import { getRegion } from "@/lib/region";
import { featuredArtists, listShows, upcomingTrips } from "@/demo/queries";
import { DEMO_TODAY } from "@/demo/store";
import { ArtistCard } from "@/components/artist/artist-card";
import { ShowCard, ShowDate } from "@/components/show/show-card";
import { SearchBar } from "@/components/artist/search-bar";
import { Section } from "@/components/ui/section";
import { Icon, type IconName } from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";

const CATEGORY_PHOTOS: Record<CategoryId, string> = {
  singer: "singer-f3", band: "band-2", dj: "dj-3", acoustic: "acoustic-2",
  instrument: "violin-1", magic: "magic-2", comedy: "comedy-1", dance: "dance-1",
};

export default async function HomePage() {
  const t = await getTranslations("home");
  const locale = (await getLocale()) as Locale;
  const region = await getRegion();
  const cur = currencyOf(region);
  const featured = featuredArtists(region, 8);
  const trips = upcomingTrips(region, 4);
  const shows = listShows(region);
  const bill = shows.slice(0, 4);
  const trust: [IconName, string][] = [["shield", t("trust1")], ["list", t("trust2")], ["lock", t("trust3")]];
  const privateEvents = [
    { type: "wedding", photo: "event-wedding" },
    { type: "birthday", photo: "event-party" },
    { type: "corporate", photo: "event-toast" },
  ] as const;
  const seeAll = (href: string) => <Link href={href} className="link-mark text-[15px]">{t("seeAll")}</Link>;

  return (
    <div>
      {/* The hero is the bill itself, printed like a venue poster: a dark stage band, the week's shows on warm paper. */}
      <section className="bg-stage text-stageink">
       <div className="wrap grid gap-10 py-10 sm:py-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-center lg:gap-16">
        <div className="min-w-0">
          <h1 className="h-hero">{t("title")}</h1>
          <p className="mt-5 max-w-[30em] text-[18px] text-stagemuted">{t("heroSub")}</p>
          <div className="mt-7 text-ink"><SearchBar region={region} minDate={DEMO_TODAY} /></div>
          <Link href="/quote" className="mt-5 inline-block border-b-[1.5px] border-stageink/60 pb-px text-[15px] font-semibold hover:border-stageink">{t("quickLink")}</Link>
        </div>
        {bill.length > 0 && (
          <div className="rounded-lg bg-gold px-5 pb-2 pt-5 text-ink sm:px-6">
            <div className="flex items-baseline justify-between gap-3 border-b border-ink/25 pb-3">
              <h2 className="display text-[22px]">{t("onStage")}</h2>
              <Link href="/shows" className="border-b-[1.5px] border-ink/50 pb-px text-[14.5px] font-semibold hover:border-ink">{t("seeAll")}</Link>
            </div>
            <ul>
              {bill.map((s) => (
                <li key={s.id} className="border-b border-ink/15 last:border-0">
                  <Link href={`/shows/${s.id}`} className="group grid grid-cols-[78px_minmax(0,1fr)_auto] items-center gap-3 py-3 sm:grid-cols-[52px_78px_minmax(0,1fr)_auto] sm:gap-4">
                    <span className="relative hidden h-[52px] w-[52px] overflow-hidden rounded-md bg-ink/10 sm:block">
                      <Image src={s.artist?.photo ?? s.venue.photo} alt="" fill sizes="52px" className="object-cover" />
                    </span>
                    <ShowDate date={s.date} start={s.start} locale={locale} size="sm" />
                    <span className="min-w-0">
                      <span className="display block truncate text-[17px] leading-tight group-hover:underline underline-offset-4">{s.title}</span>
                      <span className="block truncate text-[14.5px]">{s.venue.name}, {loc(CITIES[s.city].name, locale)}</span>
                    </span>
                    <span className="font-semibold tnum">{formatMoney(s.price, cur, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
       </div>
      </section>

      <section className="border-b border-line bg-accentsoft">
        <ul className="wrap flex flex-wrap gap-x-10 gap-y-2 py-4 text-[15px]">
          {trust.map(([icon, label]) => (
            <li key={label} className="flex items-center gap-2"><Icon name={icon} size={16} className="text-accent" />{label}</li>
          ))}
        </ul>
      </section>

      <div className="wrap mt-16 space-y-20">
        <Section title={t("featured")} action={seeAll("/artists")}>
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4 sm:gap-x-6">
            {featured.map((a) => <ArtistCard key={a.id} a={a} />)}
          </div>
        </Section>

        <Section title={t("categories")}>
          <ul className="grid grid-cols-2 border-t border-ink/20 sm:grid-cols-4 sm:gap-x-6">
            {CATEGORIES.map((c) => (
              <li key={c.id} className="border-b border-line">
                <Link href={{ pathname: "/artists", query: { category: c.id } }} className="group flex items-center gap-3 py-3">
                  <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-surface2">
                    <Image src={`/demo/photos/${CATEGORY_PHOTOS[c.id]}.jpg`} alt="" fill sizes="56px" className="object-cover" />
                  </span>
                  <span className="min-w-0">
                    <span className="display block text-[17px] leading-tight group-hover:underline decoration-accent decoration-2 underline-offset-4">{loc(c.name, locale)}</span>
                    <span className="block truncate text-[13.5px] text-muted">{loc(c.desc, locale)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      </div>

      {trips.length > 0 && (
        <section className="mt-20 bg-navy text-onnavy">
          <div className="wrap py-14">
            <h2 className="h-sec text-white">{t("trips")}</h2>
            <p className="mt-2 text-onnavymuted">{t("tripsSub")}</p>
            <ul className="mt-6 grid gap-x-12 sm:grid-cols-2">
              {trips.map(({ artist, trip }) => (
                <li key={artist.id + trip.from} className="border-t border-white/15">
                  <Link href={`/artists/${artist.slug}`} className="group flex items-center gap-4 py-4">
                    <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full">
                      <Image src={artist.photo} alt="" fill sizes="56px" className="object-cover" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="display block truncate text-[18px] leading-tight text-white group-hover:underline decoration-accent decoration-2 underline-offset-4">{artist.name}</span>
                      <span className="block truncate text-[14.5px] text-onnavymuted">
                        {t("tripRoute", { from: loc(CITIES[artist.homeCity].name, locale), to: loc(CITIES[trip.city].name, locale) })}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-md bg-gold px-2.5 py-1 text-[13.5px] font-bold text-ink tnum">{formatDateRange(trip.from, trip.to, locale)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div className="wrap mt-16 space-y-20">
        {shows.length > 0 && (
          <Section title={t("shows")} sub={t("showsSub")} action={seeAll("/shows")}>
            <div className="grid grid-cols-2 gap-x-5 gap-y-9 lg:grid-cols-4 sm:gap-x-6">
              {shows.slice(0, 4).map((s) => <ShowCard key={s.id} s={s} />)}
            </div>
          </Section>
        )}

        <Section title={t("privateTitle")} sub={t("privateSub")}>
          <div className="grid gap-5 sm:grid-cols-3">
            {privateEvents.map((e) => (
              <Link key={e.type} href={{ pathname: "/quote", query: { eventType: e.type } }} className="group block">
                <span className="relative block aspect-[4/3] overflow-hidden rounded-lg bg-surface2">
                  <Image src={`/demo/photos/${e.photo}.jpg`} alt="" fill sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" />
                </span>
                <span className="mt-3 flex items-center justify-between gap-3">
                  <span className="display text-[19px] group-hover:underline decoration-accent decoration-2 underline-offset-4">{loc(EVENT_TYPES[e.type], locale)}</span>
                  <span className={buttonClass("ghost", "sm")}>{t("privateCta")}</span>
                </span>
              </Link>
            ))}
          </div>
        </Section>

        <section>
          <h2 className="h-sec">{t("how")}</h2>
          <ol className="mt-6 grid gap-x-10 border-t border-ink/20 sm:grid-cols-3">
            {(["step1", "step2", "step3"] as const).map((k, i) => (
              <li key={k} className="flex gap-4 border-b border-line py-5 sm:border-b-0">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-ink/25 text-[15px] font-semibold tnum">{i + 1}</span>
                <span>
                  <span className="block text-[17px] font-semibold">{t(k)}</span>
                  <span className="mt-1 block text-[15px] text-muted">{t(`${k}Text`)}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <section className="grid overflow-hidden rounded-lg bg-accent text-onaccent sm:grid-cols-[minmax(0,1fr)_360px]">
          <div className="px-6 py-10 sm:px-10 sm:py-12">
            <h2 className="h-sec">{t("artistsTitle")}</h2>
            <p className="mt-3 max-w-md text-[17px] text-white/90">{t("artistsText")}</p>
            <Link href="/for-artists" className={buttonClass("light", "lg", "mt-6")}>{t("artistsCta")}</Link>
          </div>
          <div className="relative hidden sm:block">
            <Image src="/demo/photos/acoustic-6.jpg" alt="" fill sizes="360px" className="object-cover" />
          </div>
        </section>
      </div>
    </div>
  );
}
