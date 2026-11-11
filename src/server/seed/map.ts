import type { Localized, RegionId } from "@/lib/catalog";
import { MINOR_DIGITS, currencyOf } from "@/lib/money";
import { slugify } from "@/server/auth/validation";
import type { artistMedia, artistPackages, artistPrivate, artists, venuePrivate, venues } from "@/server/db/schema";

/* Pure mapping from docs/demo/seed.json to table rows (no I/O), so it can be unit tested. */

export interface SeedArtist {
  id: string; region: RegionId; name: string; kind: Localized; category: string; genres: string[]; city: string;
  area: "local" | "region" | "intl"; hue: number; rating: number; reviewsCount: number; bookings: number; top: boolean;
  verified: boolean; response: Localized; priceMin: number; priceMax: number; fee: number; joined: number; bio: Localized;
  usp: Localized; services: string[]; packages: { name: Localized; dur: Localized; from: number }[];
  media: { k: "video" | "audio" | "photo"; t: string; len?: string }[]; social: Record<string, string>; busy: string[];
  phone?: string; email?: string; payAccount?: string; internalNote?: string;
}

export interface SeedVenue {
  id: string; region: RegionId; business: string; type: string; rep: string; city: string; address: string; hue: number;
  phone?: string; email?: string; pay?: string;
}

export interface SeedAccount { id: string; email: string; role: "artist" | "venue" | "admin"; refId: string | null }

export interface SeedFile { artists: SeedArtist[]; venues: SeedVenue[]; accounts: SeedAccount[] }

/** The demo stores whole dollars for CAD; the app stores cents. VND is unchanged. */
export const toMinorUnits = (amount: number, region: RegionId): number =>
  Math.round(amount * 10 ** MINOR_DIGITS[currencyOf(region)]);

type ArtistRow = Omit<typeof artists.$inferInsert, "userId">;

export function mapArtist(a: SeedArtist) {
  const m = (n: number) => toMinorUnits(n, a.region);
  const artist: ArtistRow = {
    seedRef: a.id,
    slug: slugify(a.name),
    region: a.region,
    name: a.name,
    kind: a.kind,
    category: a.category,
    genres: a.genres,
    city: a.city,
    travelArea: a.area,
    hue: a.hue,
    bio: a.bio,
    usp: a.usp,
    eventTypes: a.services,
    responseTime: a.response,
    priceMin: m(a.priceMin),
    priceMax: m(a.priceMax),
    defaultFee: m(a.fee),
    social: a.social,
    status: "active",
    verified: a.verified,
    topPerformer: a.top,
    ratingAvg: a.rating,
    reviewsCount: a.reviewsCount,
    bookingsCount: a.bookings,
    joinedYear: a.joined,
  };
  const priv: Omit<typeof artistPrivate.$inferInsert, "artistId"> = {
    phone: a.phone || null, email: a.email || null, payoutAccount: a.payAccount || null, internalNote: a.internalNote || null,
  };
  const packages: Omit<typeof artistPackages.$inferInsert, "artistId">[] = a.packages.map((p, i) => ({
    name: p.name, durationLabel: p.dur, priceFrom: m(p.from), sort: i,
  }));
  const media: Omit<typeof artistMedia.$inferInsert, "artistId">[] = a.media.map((x, i) => ({
    kind: x.k, title: x.t, lengthLabel: x.len ?? null, sort: i,
  }));
  return { artist, priv, packages, media, busy: [...new Set(a.busy)] };
}

export function mapVenue(v: SeedVenue) {
  const venue: Omit<typeof venues.$inferInsert, "userId"> = {
    seedRef: v.id, region: v.region, businessName: v.business, type: v.type, contactName: v.rep, city: v.city, address: v.address, hue: v.hue,
  };
  const priv: Omit<typeof venuePrivate.$inferInsert, "venueId"> = { phone: v.phone || null, email: v.email || null, payoutInfo: v.pay || null };
  return { venue, priv };
}
