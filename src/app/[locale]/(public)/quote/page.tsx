import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CATEGORIES, CITIES, EVENT_TYPES, REGIONS, loc, type Locale } from "@/lib/catalog";
import { getRegion } from "@/lib/region";
import { getSessionUser } from "@/server/auth/session";
import { getArtistProfile, searchArtists } from "@/demo/queries";
import { DEMO_TODAY } from "@/demo/store";
import { QuoteForm } from "@/components/booking/quote-form";
import { Avatar } from "@/components/ui/avatar";
import { buttonClass } from "@/components/ui/button";

type Params = { artist?: string; date?: string; eventType?: string };

export default async function QuotePage({ searchParams }: { searchParams: Promise<Params> }) {
  const t = await getTranslations("quote");
  const locale = (await getLocale()) as Locale;
  const p = await searchParams;
  const user = await getSessionUser();
  const profile = p.artist ? getArtistProfile(p.artist) : null;
  const region = user?.region ?? profile?.artist.region ?? (await getRegion());
  const artist = profile && profile.artist.region === region ? profile.artist : null;
  const canSend = user && (user.role === "venue" || user.role === "client");
  const here = `/quote${p.artist ? `?artist=${p.artist}` : ""}`;

  return (
    <div className="wrap py-8 max-w-3xl">
      {artist ? (
        <div className="flex items-center gap-4">
          <Avatar name={artist.name} src={artist.photo} size={56} square />
          <div>
            <h1 className="h-sec">{t("titleSingle", { name: artist.name })}</h1>
            <p className="text-muted">{t("subSingle", { time: loc(artist.response, locale) })}</p>
          </div>
        </div>
      ) : (
        <>
          <h1 className="h-sec">{t("titleQuick")}</h1>
          <p className="text-muted mt-1">{t("subQuick")}</p>
        </>
      )}

      {!canSend ? (
        <div className="mt-8 rounded-lg border border-ink/25 bg-surface p-5">
          <p>{user ? t("wrongRole") : t("needAccount")}</p>
          {!user && <Link href={{ pathname: "/login", query: { next: here } }} className={buttonClass("primary", "md", "mt-4")}>{t("chooseAccount")}</Link>}
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted">{t("asBuyer", { name: user.displayName })}</p>
          <QuoteForm
            artistSlug={artist?.slug}
            minDate={DEMO_TODAY}
            defaults={{
              date: p.date && p.date >= DEMO_TODAY ? p.date : "",
              eventType: p.eventType && p.eventType in EVENT_TYPES ? p.eventType : user.role === "venue" ? "restaurant" : "birthday",
              category: artist?.category ?? "singer",
              city: user.city && REGIONS[region].cities.includes(user.city) ? user.city : REGIONS[region].cities[0],
            }}
            options={{
              eventTypes: Object.entries(EVENT_TYPES).map(([value, l]) => ({ value, label: loc(l, locale) })),
              categories: CATEGORIES.map((c) => ({ value: c.id, label: loc(c.name, locale) })),
              cities: REGIONS[region].cities.map((c) => ({ value: c, label: loc(CITIES[c].name, locale) })),
              budgets: REGIONS[region].budgets.map((b, i) => ({ value: String(i), label: loc(b, locale) })),
            }}
            repertoire={artist?.repertoire.map(({ id, title, original, signature }) => ({ id, title, original, signature })) ?? []}
            others={artist ? searchArtists({ region }).filter((a) => a.id !== artist.id).slice(0, 14).map((a) => ({
              id: a.id, name: a.name, label: `${loc(CATEGORIES.find((c) => c.id === a.category)?.name, locale)}, ${loc(CITIES[a.homeCity].name, locale)}`,
            })) : []}
          />
        </>
      )}
    </div>
  );
}
