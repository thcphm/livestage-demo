import Image from "next/image";
import { notFound } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, CITIES, EVENT_TYPES, loc, type Locale } from "@/lib/catalog";
import { formatDate, formatDateRange, formatShortDate } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import { getArtistProfile, isMusic } from "@/demo/queries";
import { DEMO_TODAY } from "@/demo/store";
import { ArtistCard } from "@/components/artist/artist-card";
import { Badge, Rating } from "@/components/ui/badge";
import { Icon } from "@/components/ui/icon";
import { buttonClass } from "@/components/ui/button";

export default async function ArtistProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const p = getArtistProfile(slug);
  if (!p) notFound();
  const t = await getTranslations("profile");
  const tc = await getTranslations("card");
  const locale = (await getLocale()) as Locale;
  const { artist: a } = p;
  const cur = currencyOf(a.region);
  const music = isMusic(a.category);
  const city = (c: keyof typeof CITIES) => loc(CITIES[c].name, locale);
  const signature = a.repertoire.filter((s) => s.signature);
  const trips = a.travel.filter((w) => w.to >= DEMO_TODAY);
  const h2 = "text-xl font-bold mb-3";

  return (
    <div className="wrap py-6 sm:py-8">
      <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[240px] sm:h-[360px] overflow-hidden rounded-xl">
        <div className="relative col-span-4 sm:col-span-3 row-span-2 bg-surface2">
          <Image src={a.photo} alt="" fill priority sizes="(min-width: 640px) 900px, 100vw" className="object-cover" />
        </div>
        {a.gallery.slice(0, 2).map((g) => (
          <div key={g} className="relative hidden sm:block bg-surface2">
            <Image src={g} alt="" fill sizes="300px" className="object-cover" />
          </div>
        ))}
      </div>

      <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_340px] gap-10">
        <div className="min-w-0 space-y-10">
          <header>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="h-page">{a.name}</h1>
              {a.verified && <Badge tone="ok"><Icon name="check" size={12} />{tc("verified")}</Badge>}
              {a.top && <Badge tone="gold">★ {tc("top")}</Badge>}
            </div>
            <div className="mt-1 text-muted">
              {loc(CATEGORIES.find((c) => c.id === a.category)?.name, locale)}, {a.genres.join(", ")}, {t("home", { city: city(a.homeCity) })}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              <Rating value={a.rating} count={a.reviewsCount} />
              <span className="text-muted">{tc("shows", { count: a.bookingsCount })}</span>
              <span className="text-muted">{t("response", { time: loc(a.response, locale) })}</span>
              <span className="text-muted">{t("joined", { year: a.joined })}</span>
            </div>
          </header>

          <section>
            <h2 className={h2}>{t("about")}</h2>
            <p className="leading-relaxed">{loc(a.bio, locale)}</p>
            {loc(a.usp, locale) && <p className="mt-2 text-muted leading-relaxed">{loc(a.usp, locale)}</p>}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {a.eventTypes.map((e) => <Badge key={e}>{loc(EVENT_TYPES[e], locale)}</Badge>)}
            </div>
          </section>

          <section>
            <h2 className={h2}>{music ? t("songs") : t("acts")}</h2>
            <ul className="grid sm:grid-cols-2 gap-x-6">
              {signature.map((s) => (
                <li key={s.id} className="flex items-baseline justify-between gap-3 border-b border-line py-2">
                  <span className="font-semibold">{s.title}</span>
                  <span className="text-sm text-muted truncate">{s.original}</span>
                </li>
              ))}
            </ul>
            <details className="mt-3 text-sm">
              <summary className="cursor-pointer text-accent">{t("allSongs", { count: a.repertoire.length })}</summary>
              <ul className="mt-2 grid sm:grid-cols-2 gap-x-6">
                {a.repertoire.map((s) => (
                  <li key={s.id} className="flex justify-between gap-3 py-1.5 border-b border-line">
                    <span>{s.title}</span><span className="text-muted truncate">{s.original}</span>
                  </li>
                ))}
              </ul>
            </details>
          </section>

          <section>
            <h2 className={h2}>{t("packages")}</h2>
            <ul className="divide-y divide-line rounded-xl bg-surface shadow-card">
              {a.packages.map((pk, i) => (
                <li key={i} className="flex items-center justify-between gap-4 px-4 py-3">
                  <div>
                    <div className="font-medium">{loc(pk.name, locale)}</div>
                    <div className="text-sm text-muted">{loc(pk.dur, locale)}</div>
                  </div>
                  <div className="text-right text-sm"><span className="text-muted">{t("from")} </span><span className="font-bold text-accentink tnum">{formatMoney(pk.from, cur, locale)}</span></div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className={h2}>{t("schedule")}</h2>
            {trips.length > 0 && (
              <ul className="mb-4 space-y-2">
                {trips.map((w) => (
                  <li key={w.from} className="flex gap-3 rounded-lg border-l-4 border-accent bg-accentsoft px-3 py-2.5 text-sm">
                    <Icon name="cal" size={16} className="text-accent mt-0.5" />
                    <div>
                      <div className="font-medium">{city(a.homeCity)} – {city(w.city)}, {formatDateRange(w.from, w.to, locale)}</div>
                      <div className="text-muted">{loc(w.note, locale) || t("tripOpen")}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {p.upcoming.length ? (
              <ul className="divide-y divide-line border-y border-line">
                {p.upcoming.map((i, k) => (
                  <li key={k} className="flex items-center gap-4 py-2.5 text-sm">
                    <span className="w-28 shrink-0 font-semibold text-accentink tnum">{formatDate(i.date, locale)}</span>
                    {i.kind === "show" ? (
                      <span className="min-w-0 flex-1 truncate">
                        <Link href={`/shows/${i.bookingId}`} className="font-medium hover:underline underline-offset-2">{i.venueName}</Link>
                        <span className="text-muted">, {i.start}, {city(i.city)}</span>
                      </span>
                    ) : (
                      <span className="flex-1 text-muted">{t("privateEvent")}, {city(i.city)}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">{t("scheduleEmpty")}</p>}
          </section>

          {p.past.length > 0 && (
            <section>
              <h2 className={h2}>{t("recent")}</h2>
              <ul className="text-sm space-y-1.5">
                {p.past.map((i, k) => (
                  <li key={k} className="flex gap-4">
                    <span className="w-14 text-muted tnum">{formatShortDate(i.date, locale)}</span>
                    <span>{i.kind === "show" ? i.venueName : t("privateEvent")} <span className="text-muted">· {city(i.city)}</span></span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2 className={h2}>{t("reviews")} <span className="text-muted font-normal">· {a.rating.toFixed(1)}</span></h2>
            {p.reviews.length ? (
              <ul className="space-y-5">
                {p.reviews.map((r) => (
                  <li key={r.id}>
                    <div className="flex items-center gap-2 text-sm">
                      <Rating value={r.rating} />
                      <span className="font-medium">{r.author}</span>
                      <span className="text-muted">· {formatShortDate(r.date, locale)}</span>
                    </div>
                    <p className="mt-1">{r.text}</p>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-muted">{t("noReviews")}</p>}
          </section>
        </div>

        <aside className="lg:sticky lg:top-28 self-start overflow-hidden rounded-xl border-t-4 border-accent bg-surface p-5 shadow-lift">
          <div className="text-sm text-muted">{t("from")}</div>
          <div className="text-3xl font-bold text-accentink tnum">{formatMoney(a.priceMin, cur, locale)}</div>
          <div className="mt-4 text-sm font-medium">{t("nextFree")}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {p.freeDays.slice(0, 8).map((d) => (
              <Link key={d} href={{ pathname: "/quote", query: { artist: a.slug, date: d } }} className="rounded-md bg-oksoft px-2 py-1 text-[13px] font-medium text-ok tnum hover:bg-ok hover:text-white">
                {formatShortDate(d, locale)}
              </Link>
            ))}
          </div>
          <Link href={{ pathname: "/quote", query: { artist: a.slug } }} className={buttonClass("primary", "lg", "w-full mt-5")}>{t("request")}</Link>
          <p className="mt-3 flex gap-2 text-xs text-muted"><Icon name="lock" size={14} className="shrink-0" />{t("safe")}</p>
        </aside>
      </div>

      {p.similar.length > 0 && (
        <section className="mt-16">
          <h2 className="h-sub mb-4">{t("similar")}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">{p.similar.map((s) => <ArtistCard key={s.id} a={s} />)}</div>
        </section>
      )}
    </div>
  );
}
