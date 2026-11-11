import seed from "../../docs/demo/seed.json";
import type { BookingStatus, CategoryId, CityId, EquipmentId, EventTypeId, PayMethod, RegionId, TravelArea, VenueTypeId } from "@/lib/catalog";
import { slugify } from "@/server/auth/validation";
import { toMinorUnits } from "@/server/seed/map";
import { applyOps } from "./ops";
import { CLIENTS, NEW_ARTISTS, NEW_BOOKINGS, NEW_REVIEWS, NEW_VENUES, SEED_ARTIST_EXTRAS, VENUE_PHOTOS, songs } from "./extra";
import type { DemoAccount, DemoArtist, DemoBooking, DemoData, DemoMessage, DemoReview, DemoTicket, DemoVenue } from "./types";

/*
 * Builds the demo dataset from docs/demo/seed.json plus src/demo/extra.ts.
 * Pure and deterministic: every call returns a fresh copy (the store mutates its own).
 */

const YEAR = 2026;

/** Seed timestamps look like "27/10 10:12" (no year); dates like "11/10/2026" or "19/10". */
export function seedTime(s: string): string {
  const [date, time = "00:00"] = s.trim().split(" ");
  const [d, m, y = String(YEAR)] = date.split("/");
  return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}T${time}`;
}
const seedDate = (s: string) => seedTime(s).slice(0, 10);

type SeedBooking = (typeof seed.bookings)[number];

function mapSeedArtist(a: (typeof seed.artists)[number]): DemoArtist {
  const x = SEED_ARTIST_EXTRAS[a.id];
  const m = (n: number) => toMinorUnits(n, a.region as RegionId);
  return {
    id: a.id, slug: slugify(a.name), region: a.region as RegionId, name: a.name, kind: a.kind, category: a.category as CategoryId,
    genres: a.genres, homeCity: a.city as CityId, servesCities: x.servesCities, travelArea: a.area as TravelArea,
    rating: a.rating, reviewsCount: a.reviewsCount, bookingsCount: a.bookings, verified: a.verified, top: a.top,
    response: a.response, priceMin: m(a.priceMin), priceMax: m(a.priceMax), bio: a.bio, usp: a.usp,
    eventTypes: a.services as EventTypeId[], packages: a.packages.map((p) => ({ ...p, from: m(p.from) })),
    photo: x.photo, gallery: x.gallery, repertoire: songs(a.id, x.repertoire), travel: x.travel ?? [], joined: a.joined, hue: a.hue,
    private: {
      phone: a.phone ?? "", email: a.email ?? "", payout: a.payAccount ?? "", internalNote: a.internalNote ?? "",
      blockedDates: [...new Set(a.busy)], fee: x.fee,
    },
  };
}

function mapNewArtist(a: (typeof NEW_ARTISTS)[number]): DemoArtist {
  return {
    id: a.id, slug: slugify(a.name), region: a.region, name: a.name, kind: a.kind, category: a.category, genres: a.genres,
    homeCity: a.homeCity, servesCities: a.servesCities, travelArea: a.travelArea, rating: a.rating, reviewsCount: a.reviewsCount,
    bookingsCount: a.bookingsCount, verified: a.verified, top: a.top,
    response: a.region === "vn" ? { vi: "< 2 giờ", en: "< 2 hrs" } : { vi: "< 3 giờ", en: "< 3 hrs" },
    priceMin: a.priceMin, priceMax: a.priceMax, bio: a.bio, usp: { vi: "", en: "" }, eventTypes: a.eventTypes, packages: a.packages,
    photo: a.photo, gallery: a.gallery, repertoire: songs(a.id, a.repertoire), travel: a.travel ?? [], joined: a.joined, hue: a.hue,
    private: { phone: a.phone, email: a.email, payout: a.payout, internalNote: "", blockedDates: a.blocked ?? [], fee: a.fee },
  };
}

function mapSeedVenue(v: (typeof seed.venues)[number]): DemoVenue {
  return {
    id: v.id, region: v.region as RegionId, name: v.business, type: v.type as VenueTypeId, contact: v.rep, city: v.city as CityId,
    address: v.address, photo: VENUE_PHOTOS[v.id], hue: v.hue, private: { phone: v.phone, email: v.email, payout: v.pay },
  };
}

function mapSeedBooking(b: SeedBooking): DemoBooking {
  const region = b.region as RegionId;
  const m = (n: number) => toMinorUnits(n, region);
  const messages: DemoMessage[] = b.messages.map((x, i) => ({
    id: `${b.id}-m${i + 1}`, from: x.from === "venue" ? "buyer" : x.from === "olive" ? "admin" : "artist", text: x.text, at: seedTime(x.at),
  }));
  const pay = b.payment as null | { depositPct: number; deposit: number; method: string; paidAt: string; remainingPaid: boolean };
  return {
    id: b.id, region, source: b.source as DemoBooking["source"], groupId: b.groupId, buyerKind: "venue", buyerId: b.venueId,
    artistId: b.artistId, category: b.category as CategoryId, title: b.title, eventType: b.eventType as EventTypeId, date: b.date,
    start: b.start, duration: b.duration, city: b.city as CityId, address: b.address, guests: b.guests, budget: b.budget, fee: m(b.fee),
    equipment: b.equipment as EquipmentId[], notes: b.notes, status: b.status as BookingStatus, flagged: b.flagged,
    isPublic: b.source === "slot" || b.ticketing.on,
    ticketing: b.ticketing.on ? { price: m(b.ticketing.price), capacity: b.ticketing.capacity } : null,
    quote: b.quote ? { ...b.quote, price: m(b.quote.price), travel: m(b.quote.travel), overtime: m(b.quote.overtime), at: seedTime(b.quote.at) } : null,
    setlist: [], songRequests: [], contract: null,
    payment: pay ? { provider: "manual", method: pay.method as PayMethod, depositPct: pay.depositPct, deposit: m(pay.deposit), paidAt: seedTime(pay.paidAt), remainingPaid: pay.remainingPaid } : null,
    messages, history: b.history.map((h) => ({ at: seedTime(h.at), text: h.text })),
    review: b.review ? { ...b.review, at: seedDate(b.review.at) } : null, createdAt: b.createdAt,
  };
}

/**
 * Three past public shows per artist (Sep–Oct), so profiles and the quick view have recent shows (R5).
 * Played at a venue in the artist's home city when there is one, otherwise elsewhere in the region.
 */
function pastShows(artists: DemoArtist[], venues: DemoVenue[], existing: DemoBooking[]): DemoBooking[] {
  const out: DemoBooking[] = [];
  const taken = new Set(existing.filter((b) => b.artistId).map((b) => `${b.artistId}|${b.date}`));
  artists.forEach((a, i) => {
    const local = venues.filter((v) => v.city === a.homeCity && v.type !== "corporate");
    const pool = local.length ? local : venues.filter((v) => v.region === a.region && v.type !== "corporate");
    for (let k = 0; k < 3; k++) {
      const v = pool[(i + k) % pool.length];
      let day = 28 - ((i * 5 + k * 11) % 26);
      const month = k === 2 ? "09" : "10";
      const at = (d: number) => `${YEAR}-${month}-${String(d).padStart(2, "0")}`;
      while (taken.has(`${a.id}|${at(day)}`)) day = day > 1 ? day - 1 : 28;
      const date = at(day);
      taken.add(`${a.id}|${date}`);
      out.push({
        id: `p-${a.id}-${k + 1}`, region: a.region, source: "slot", groupId: null, buyerKind: "venue", buyerId: v.id, artistId: a.id,
        category: a.category, title: `${a.name} · Live`, eventType: v.type === "bar" ? "bar" : "restaurant", date, start: k === 1 ? "19:30" : "20:00",
        duration: 2, city: v.city, address: v.address, guests: 60, budget: 1, fee: 0, equipment: [], notes: "", status: "completed",
        flagged: false, isPublic: true, ticketing: null, quote: null, setlist: [], songRequests: [], contract: null, payment: null,
        messages: [], history: [], review: null, createdAt: date,
      });
    }
  });
  return out;
}

export function buildDemoData(): DemoData {
  const artists = [...seed.artists.map(mapSeedArtist), ...NEW_ARTISTS.map(mapNewArtist)];
  const venues = [...seed.venues.map(mapSeedVenue), ...NEW_VENUES.map((v) => structuredClone(v))];
  const clients = CLIENTS.map((c) => structuredClone(c));
  const buyerRegion = (kind: string, id: string): RegionId =>
    (kind === "venue" ? venues.find((v) => v.id === id) : clients.find((c) => c.id === id))!.region;

  const listed: DemoBooking[] = [
    ...seed.bookings.map(mapSeedBooking),
    ...NEW_BOOKINGS.map((b) => ({ ...structuredClone(b), region: buyerRegion(b.buyerKind, b.buyerId) })),
  ];
  const bookings = [...listed, ...pastShows(artists, venues, listed)];

  const tickets: DemoTicket[] = seed.tickets.map((t) => {
    const region = seed.bookings.find((b) => b.id === t.bookingId)!.region as RegionId;
    return { ...t, total: toMinorUnits(t.total, region), method: t.method as PayMethod, at: seedTime(t.at) };
  });

  const reviews: DemoReview[] = [
    ...seed.reviews.map((r) => ({ id: r.id, artistId: r.artistId, author: r.author, rating: r.rating, text: r.text, date: seedDate(r.at), eventType: r.event as EventTypeId })),
    ...NEW_REVIEWS.map((r) => ({ ...r })),
  ];

  const accounts: DemoAccount[] = [
    ...seed.accounts.map((a) => ({ id: a.id, email: a.email, role: a.role as DemoAccount["role"], refId: a.refId })),
    ...NEW_ARTISTS.map((a) => ({ id: `u-${a.id}`, email: a.email, role: "artist" as const, refId: a.id })),
    ...NEW_VENUES.map((v) => ({ id: `u-${v.id}`, email: v.private.email, role: "venue" as const, refId: v.id })),
    ...clients.map((c) => ({ id: `u-${c.id}`, email: c.private.email, role: "client" as const, refId: c.id })),
  ];

  return applyOps({ artists, venues, clients, bookings, tickets, reviews, accounts });
}
