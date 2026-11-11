import type { CategoryId, CityId } from "@/lib/catalog";

/**
 * Where an artist is on a given day, and whether they can take a booking there (R3).
 * Pure functions: dates are "YYYY-MM-DD" strings in the city's local calendar.
 */

/** A stretch of days the artist will be in another city and is open for bookings there. */
export interface TravelWindow {
  from: string;
  to: string;
  city: CityId;
}

export interface AvailabilityArtist {
  id: string;
  category: CategoryId;
  homeCity: CityId;
  /** Cities the artist will also travel to from home (same region), without a travel window. */
  servesCities: CityId[];
  travel: TravelWindow[];
  /** Days the artist marked as unavailable (private, R2). */
  blockedDates: string[];
  rating: number;
  priceMin: number;
}

/** Bookings that already occupy the artist's day. */
export interface DayBooking {
  artistId: string | null;
  date: string;
  /** Only pending_payment / confirmed / completed bookings hold the day. */
  holdsDay: boolean;
}

const inWindow = (w: TravelWindow, date: string) => w.from <= date && date <= w.to;

/** The travel window covering `date`, if any. */
export const travelOn = (artist: Pick<AvailabilityArtist, "travel">, date: string): TravelWindow | null =>
  artist.travel.find((w) => inWindow(w, date)) ?? null;

/** City the artist is based in on `date`: the travel window's city, else home. */
export const cityOn = (artist: Pick<AvailabilityArtist, "travel" | "homeCity">, date: string): CityId =>
  travelOn(artist, date)?.city ?? artist.homeCity;

/** Whether the artist can perform in `city` (ignoring the date): home, served cities or any travel window. */
export const reachesCity = (artist: AvailabilityArtist, city: CityId): boolean =>
  artist.homeCity === city || artist.servesCities.includes(city) || artist.travel.some((w) => w.city === city);

export function isBooked(artistId: string, date: string, bookings: DayBooking[]): boolean {
  return bookings.some((b) => b.holdsDay && b.artistId === artistId && b.date === date);
}

export type AvailabilityReason = "home" | "serves" | "travel";

/**
 * Can the artist play in `city` on `date`?
 * During a travel window the artist is only bookable in that window's city.
 */
export function availabilityOn(artist: AvailabilityArtist, city: CityId, date: string, bookings: DayBooking[]):
  { ok: true; reason: AvailabilityReason } | { ok: false } {
  if (artist.blockedDates.includes(date) || isBooked(artist.id, date, bookings)) return { ok: false };
  const trip = travelOn(artist, date);
  if (trip) return trip.city === city ? { ok: true, reason: "travel" } : { ok: false };
  if (artist.homeCity === city) return { ok: true, reason: "home" };
  if (artist.servesCities.includes(city)) return { ok: true, reason: "serves" };
  return { ok: false };
}

export interface MatchCriteria {
  city: CityId;
  date?: string;
  category?: CategoryId;
  /** Upper budget in minor units; artists whose starting price is above it are left out. */
  budgetMax?: number;
}

/**
 * Artists that fit the criteria, best first: same city before travelling artists, then rating.
 * Without a date, an artist matches when they can reach the city at all.
 */
export function matchArtists<A extends AvailabilityArtist>(artists: A[], criteria: MatchCriteria, bookings: DayBooking[], limit = Infinity): A[] {
  const score = (a: A): number | null => {
    if (criteria.category && a.category !== criteria.category) return null;
    if (criteria.budgetMax !== undefined && a.priceMin > criteria.budgetMax) return null;
    if (criteria.date) {
      const r = availabilityOn(a, criteria.city, criteria.date, bookings);
      if (!r.ok) return null;
      return r.reason === "home" ? 0 : 1;
    }
    if (!reachesCity(a, criteria.city)) return null;
    return a.homeCity === criteria.city ? 0 : 1;
  };
  return artists
    .map((a) => ({ a, s: score(a) }))
    .filter((x): x is { a: A; s: number } => x.s !== null)
    .sort((x, y) => x.s - y.s || y.a.rating - x.a.rating)
    .slice(0, limit)
    .map((x) => x.a);
}

/** Quick Free Quote sends one request to at most this many artists. */
export const QUICK_QUOTE_LIMIT = 5;
