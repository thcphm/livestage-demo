import type { CityId } from "@/lib/catalog";

/**
 * Public vs private artist schedule (R2).
 * Anyone sees where and when an artist performs; private events show only "private event · city",
 * and blocked days / pending requests never leave the artist's own view.
 */

export interface ScheduleBooking {
  id: string;
  artistId: string | null;
  date: string;
  start: string;
  city: CityId;
  status: string;
  /** Public shows happen at a venue that sells tickets or is open to the public. */
  isPublic: boolean;
  title: string;
  venueName: string | null;
}

export type PublicScheduleItem =
  | { kind: "show"; bookingId: string; date: string; start: string; city: CityId; title: string; venueName: string | null }
  | { kind: "private"; date: string; city: CityId };

const PUBLIC_STATUSES = new Set(["confirmed", "completed"]);

/** What other people may see of an artist's bookings, oldest first. */
export function publicSchedule(artistId: string, bookings: ScheduleBooking[]): PublicScheduleItem[] {
  return bookings
    .filter((b) => b.artistId === artistId && PUBLIC_STATUSES.has(b.status))
    .sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start))
    .map((b): PublicScheduleItem => b.isPublic
      ? { kind: "show", bookingId: b.id, date: b.date, start: b.start, city: b.city, title: b.title, venueName: b.venueName }
      : { kind: "private", date: b.date, city: b.city });
}

/** Upcoming (from `today`, inclusive) and recent (before `today`, newest first) items. */
export function splitByDate<T extends { date: string }>(items: T[], today: string): { upcoming: T[]; past: T[] } {
  return {
    upcoming: items.filter((i) => i.date >= today),
    past: items.filter((i) => i.date < today).reverse(),
  };
}
