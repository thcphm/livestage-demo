/**
 * Ticketed-show rules (meeting 2026-11-07).
 * A show is guaranteed to go ahead once half of its seats are sold; until then the venue may still
 * change the line-up, and a substitute artist can be put on the bill through the platform.
 */

/** Share of capacity that must be sold before the show is guaranteed. */
export const GUARANTEE_PCT = 50;

export function isGuaranteed(sold: number, capacity: number): boolean {
  return capacity > 0 && sold * 100 >= capacity * GUARANTEE_PCT;
}

/** Tickets still to sell before the show is guaranteed (0 once it is). */
export function ticketsToGuarantee(sold: number, capacity: number): number {
  return Math.max(0, Math.ceil((capacity * GUARANTEE_PCT) / 100) - sold);
}

export interface Substitution {
  fromArtistId: string;
  toArtistId: string;
  reason: string;
  at: string;
}

/** A substitute must be a different artist, same kind of act, and free that day. */
export function canSubstitute(current: string | null, candidate: { id: string; category: string; free: boolean }, category: string): boolean {
  return candidate.id !== current && candidate.category === category && candidate.free;
}

/** The venue decides whether an under-sold show goes ahead this many days before it. */
export const DECISION_DAYS = 3;

/** Last day (YYYY-MM-DD) for the venue to cancel a show that has not reached the guarantee. */
export function decisionDate(showDate: string): string {
  const d = new Date(`${showDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() - DECISION_DAYS);
  return d.toISOString().slice(0, 10);
}

/* ---------- table reservations ---------- */

export const OPEN_FROM = "11:00";
export const OPEN_TO = "22:30";
/** Guests a venue seats per one-hour slot through the widget (per-venue setting in the real build). */
export const MAX_GUESTS_PER_SLOT = 40;

export const withinOpeningHours = (time: string): boolean => /^\d{2}:\d{2}$/.test(time) && time >= OPEN_FROM && time <= OPEN_TO;

/** Guests already booked for the same date and hour (cancelled reservations do not count). */
export function slotLoad(reservations: { date: string; time: string; party: number; status: string }[], date: string, time: string): number {
  const hour = time.slice(0, 2);
  return reservations.filter((r) => r.date === date && r.time.slice(0, 2) === hour && r.status !== "cancelled").reduce((n, r) => n + r.party, 0);
}

export const tableAvailable = (load: number, party: number): boolean => load + party <= MAX_GUESTS_PER_SLOT;
