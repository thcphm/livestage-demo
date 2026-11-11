import "server-only";
import { BOOKED_STATUSES, type BookingStatus, type CategoryId, type CityId, type RegionId } from "@/lib/catalog";
import { availabilityOn, matchArtists, travelOn, type AvailabilityArtist, type DayBooking } from "@/server/domain/availability";
import { contactsRevealed, visibleMessage } from "@/server/domain/messaging";
import { publicSchedule, splitByDate, type PublicScheduleItem, type ScheduleBooking } from "@/server/domain/schedule";
import { checkout, splitPayment, ticketCommission, type FeeSplit, type PlatformRates } from "@/server/domain/fees";
import { canSubstitute, decisionDate, isGuaranteed, ticketsToGuarantee } from "@/server/domain/shows";
import { depositAmount } from "@/lib/money";
import type { SessionUser } from "@/server/auth/session";
import { DEMO_TODAY, getStore } from "./store";
import type { Localized } from "@/lib/catalog";
import type { DemoArtist, DemoBooking, DemoData, DemoLead, DemoReview, DemoStaff, DemoTravel, DemoVenue, Song } from "./types";

/*
 * Read side of the demo, shaped per viewer. This is where the privacy rules (project guide §5, R2, R4, R7) apply:
 * pages only ever receive what their viewer may see.
 */

const MUSIC: CategoryId[] = ["singer", "band", "dj", "acoustic", "instrument"];
export const isMusic = (c: CategoryId) => MUSIC.includes(c);

const toAvailability = (a: DemoArtist): AvailabilityArtist & { src: DemoArtist } => ({
  id: a.id, category: a.category, homeCity: a.homeCity, servesCities: a.servesCities, travel: a.travel,
  blockedDates: a.private.blockedDates, rating: a.rating, priceMin: a.priceMin, src: a,
});

const dayBookings = (s: DemoData): DayBooking[] =>
  s.bookings.map((b) => ({ artistId: b.artistId, date: b.date, holdsDay: BOOKED_STATUSES.includes(b.status) }));

function venueName(s: DemoData, b: DemoBooking): string | null {
  return b.buyerKind === "venue" ? s.venues.find((v) => v.id === b.buyerId)?.name ?? null : null;
}

const scheduleRows = (s: DemoData): ScheduleBooking[] => s.bookings.map((b) => ({
  id: b.id, artistId: b.artistId, date: b.date, start: b.start, city: b.city, status: b.status,
  isPublic: b.isPublic, title: b.title, venueName: venueName(s, b),
}));

/* ---------- artists ---------- */

export interface QuickView {
  recentShows: { date: string; venueName: string | null; city: CityId }[];
  signatureSongs: Pick<Song, "title" | "original">[];
}

export interface ArtistCard {
  id: string;
  slug: string;
  name: string;
  kind: DemoArtist["kind"];
  category: CategoryId;
  genres: string[];
  homeCity: CityId;
  region: RegionId;
  photo: string;
  rating: number;
  reviewsCount: number;
  bookingsCount: number;
  verified: boolean;
  top: boolean;
  priceMin: number;
  review: Pick<DemoReview, "text" | "author"> | null;
  /** Set when the search has a date: where the artist is that day and why they match. */
  availability: { city: CityId; travelling: boolean; note: DemoTravel["note"] | null } | null;
  /** Travel windows from today on, so cards can mention upcoming trips. */
  trips: DemoTravel[];
  quick: QuickView;
}

function quickView(s: DemoData, a: DemoArtist): QuickView {
  const past = publicSchedule(a.id, scheduleRows(s)).filter((i) => i.date < DEMO_TODAY).reverse().slice(0, 3);
  return {
    recentShows: past.map((i) => ({ date: i.date, city: i.city, venueName: i.kind === "show" ? i.venueName : null })),
    signatureSongs: a.repertoire.filter((x) => x.signature).slice(0, 4).map(({ title, original }) => ({ title, original })),
  };
}

function toCard(s: DemoData, a: DemoArtist, date?: string): ArtistCard {
  const review = s.reviews.filter((r) => r.artistId === a.id).sort((x, y) => y.date.localeCompare(x.date))[0];
  const trip = date ? travelOn(a, date) : null;
  return {
    id: a.id, slug: a.slug, name: a.name, kind: a.kind, category: a.category, genres: a.genres, homeCity: a.homeCity, region: a.region,
    photo: a.photo, rating: a.rating, reviewsCount: a.reviewsCount, bookingsCount: a.bookingsCount, verified: a.verified, top: a.top,
    priceMin: a.priceMin, review: review ? { text: review.text, author: review.author } : null,
    availability: date ? { city: trip?.city ?? a.homeCity, travelling: !!trip, note: a.travel.find((w) => w === trip)?.note ?? null } : null,
    trips: a.travel.filter((w) => w.to >= DEMO_TODAY),
    quick: quickView(s, a),
  };
}

export interface ArtistSearch {
  region: RegionId;
  city?: CityId;
  date?: string;
  category?: CategoryId;
  budgetMax?: number;
  q?: string;
  sort?: "recommended" | "price" | "rating";
}

export function searchArtists(f: ArtistSearch): ArtistCard[] {
  const s = getStore();
  let list = s.artists.filter((a) => a.region === f.region);
  if (f.q) {
    const q = f.q.toLocaleLowerCase();
    list = list.filter((a) => [a.name, ...a.genres, ...a.repertoire.map((x) => x.title)].some((t) => t.toLocaleLowerCase().includes(q)));
  }
  let ranked: DemoArtist[];
  if (f.city) {
    ranked = matchArtists(list.map(toAvailability), { city: f.city, date: f.date, category: f.category, budgetMax: f.budgetMax }, dayBookings(s)).map((x) => x.src);
  } else {
    ranked = list
      .filter((a) => (!f.category || a.category === f.category) && (f.budgetMax === undefined || a.priceMin <= f.budgetMax))
      .sort((x, y) => Number(y.top) - Number(x.top) || y.rating - x.rating);
  }
  if (f.sort === "price") ranked = [...ranked].sort((x, y) => x.priceMin - y.priceMin);
  if (f.sort === "rating") ranked = [...ranked].sort((x, y) => y.rating - x.rating || y.reviewsCount - x.reviewsCount);
  return ranked.map((a) => toCard(s, a, f.date));
}

export function featuredArtists(region: RegionId, n = 6): ArtistCard[] {
  return searchArtists({ region }).slice(0, n);
}

/** Artists visiting another city soon (R3), for the home page. */
export function upcomingTrips(region: RegionId, n = 4): { artist: ArtistCard; trip: DemoTravel }[] {
  const s = getStore();
  return s.artists
    .filter((a) => a.region === region)
    .flatMap((a) => a.travel.filter((w) => w.to >= DEMO_TODAY).map((trip) => ({ a, trip })))
    .sort((x, y) => x.trip.from.localeCompare(y.trip.from))
    .slice(0, n)
    .map(({ a, trip }) => ({ artist: toCard(s, a), trip }));
}

export interface ArtistProfile {
  card: ArtistCard;
  artist: Omit<DemoArtist, "private">;
  upcoming: PublicScheduleItem[];
  past: PublicScheduleItem[];
  reviews: DemoReview[];
  similar: ArtistCard[];
  /** Dates in the next ~10 weeks when the artist is free at home (for the availability strip). */
  freeDays: string[];
}

export function getArtistProfile(slug: string): ArtistProfile | null {
  const s = getStore();
  const a = s.artists.find((x) => x.slug === slug);
  if (!a) return null;
  const { private: _hidden, ...pub } = a;
  void _hidden;
  const { upcoming, past } = splitByDate(publicSchedule(a.id, scheduleRows(s)), DEMO_TODAY);
  const days = dayBookings(s);
  const freeDays: string[] = [];
  for (let i = 0; i < 70; i++) {
    const d = addDays(DEMO_TODAY, i);
    if (availabilityOn(toAvailability(a), travelOn(a, d)?.city ?? a.homeCity, d, days).ok) freeDays.push(d);
  }
  return {
    card: toCard(s, a), artist: pub, upcoming, past: past.slice(0, 6),
    reviews: s.reviews.filter((r) => r.artistId === a.id).sort((x, y) => y.date.localeCompare(x.date)),
    similar: s.artists.filter((x) => x.id !== a.id && x.region === a.region && x.category === a.category).slice(0, 3).map((x) => toCard(s, x)),
    freeDays,
  };
}

export function addDays(ymd: string, n: number): string {
  const d = new Date(`${ymd}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/* ---------- shows & tickets ---------- */

export interface ShowCard {
  id: string;
  title: string;
  date: string;
  start: string;
  duration: number;
  city: CityId;
  address: string;
  region: RegionId;
  venue: Pick<DemoVenue, "id" | "name" | "photo">;
  artist: Pick<DemoArtist, "id" | "slug" | "name" | "photo" | "kind" | "genres"> | null;
  price: number;
  capacity: number;
  sold: number;
  /** Dinner + show combo, when the venue offers one. */
  comboPrice: number | null;
  comboIncludes: Localized | null;
  /** Half the seats sold: the show is guaranteed to go ahead. */
  guaranteed: boolean;
  toGuarantee: number;
  /** Line-up change made by the venue: who was replaced. */
  substitution: { from: string; reason: string; at: string } | null;
  /** Cancelled by the venue before reaching the guarantee; every ticket was refunded. */
  cancelled: boolean;
  /** Last day the venue may still cancel an under-sold show. */
  decideBy: string;
}

function toShow(s: DemoData, b: DemoBooking): ShowCard {
  const v = s.venues.find((x) => x.id === b.buyerId)!;
  const a = b.artistId ? s.artists.find((x) => x.id === b.artistId) ?? null : null;
  const sold = s.tickets.filter((t) => t.bookingId === b.id).reduce((n, t) => n + t.qty, 0);
  return {
    id: b.id, title: b.title, date: b.date, start: b.start, duration: b.duration, city: b.city, address: b.address, region: b.region,
    venue: { id: v.id, name: v.name, photo: v.photo },
    artist: a ? { id: a.id, slug: a.slug, name: a.name, photo: a.photo, kind: a.kind, genres: a.genres } : null,
    price: b.ticketing!.price, capacity: b.ticketing!.capacity, sold,
    comboPrice: b.ticketing!.combo?.price ?? null, comboIncludes: b.ticketing!.combo?.includes ?? null,
    guaranteed: isGuaranteed(sold, b.ticketing!.capacity), toGuarantee: ticketsToGuarantee(sold, b.ticketing!.capacity),
    cancelled: b.status === "cancelled", decideBy: decisionDate(b.date),
    substitution: b.substitution ? { from: s.artists.find((x) => x.id === b.substitution!.fromArtistId)?.name ?? "", reason: b.substitution.reason, at: b.substitution.at } : null,
  };
}

export function listShows(region: RegionId, city?: CityId): ShowCard[] {
  const s = getStore();
  return s.bookings
    .filter((b) => b.region === region && b.ticketing && b.status === "confirmed" && b.date >= DEMO_TODAY && (!city || b.city === city))
    .sort((x, y) => (x.date + x.start).localeCompare(y.date + y.start))
    .map((b) => toShow(s, b));
}

export function getShow(id: string): ShowCard | null {
  const s = getStore();
  // A cancelled show keeps its page so ticket holders can see what happened.
  const b = s.bookings.find((x) => x.id === id && x.ticketing && (x.status === "confirmed" || x.status === "cancelled"));
  return b ? toShow(s, b) : null;
}

export function findTickets(email: string) {
  const s = getStore();
  const e = email.trim().toLowerCase();
  return [...s.tickets, ...s.refunds].filter((t) => t.email.toLowerCase() === e).map((t) => ({ ticket: t, show: getShow(t.bookingId) }));
}

export function getTicket(code: string) {
  const s = getStore();
  const t = s.tickets.find((x) => x.code === code);
  if (t) return { ticket: t, show: getShow(t.bookingId), refund: null };
  const r = s.refunds.find((x) => x.code === code);
  return r ? { ticket: r, show: getShow(r.bookingId), refund: { at: r.refundedAt, reason: r.reason } } : null;
}

/* ---------- bookings, per viewer ---------- */

export type Viewer = Pick<SessionUser, "role" | "entityId" | "staff">;

/** Artist managers act for the artists on their roster. */
export const actsFor = (v: Viewer, artistId: string | null): boolean =>
  !!artistId && ((v.role === "artist" && v.entityId === artistId) || (v.role === "manager" && !!v.staff?.roster.includes(artistId)));

export function canSeeBooking(v: Viewer, b: DemoBooking): boolean {
  if (v.role === "admin") return true;
  if (v.role === "artist") return b.artistId === v.entityId || (b.status === "open" && b.artistId === null);
  if (v.role === "manager") return actsFor(v, b.artistId);
  if (v.role === "recruiter") return false;
  return b.buyerKind === v.role && b.buyerId === v.entityId;
}

export interface Party {
  name: string;
  photo: string | null;
  hue: number;
  kindLabel: "venue" | "client" | "artist";
  /** Null until contacts are revealed. */
  phone: string | null;
  email: string | null;
}

export interface BookingView {
  booking: Omit<DemoBooking, "messages" | "address"> & { address: string | null };
  artist: (Pick<DemoArtist, "id" | "slug" | "name" | "photo" | "hue" | "repertoire" | "kind"> & { contact: Party }) | null;
  buyer: Party;
  messages: (DemoBooking["messages"][number] & { masked: boolean })[];
  contactsRevealed: boolean;
  /** Admin only: Olive's cut and the artist payout for this booking (R4). */
  feeSplit: (FeeSplit & { bps: number }) | null;
  viewerSide: "buyer" | "artist" | "admin";
  ticketsSold: number;
  /** Other artists booked in the same group order, with the order total so far. */
  order: { id: string; items: { id: string; artist: string; status: BookingStatus; price: number | null; current: boolean }[]; total: number; payable: { count: number; deposit: number } } | null;
  /** Admin only: what Olive adds for the customer and takes from the venue's ticket revenue. */
  platform: { customerFee: number; customerBps: number; ticketRevenue: number; ticketCommission: number } | null;
}

export function bookingView(v: Viewer, id: string): BookingView | null {
  const s = getStore();
  const b = s.bookings.find((x) => x.id === id);
  if (!b || !canSeeBooking(v, b)) return null;
  const revealed = contactsRevealed(b.status);
  const isAdmin = v.role === "admin";
  const showContacts = revealed || isAdmin;
  const a = b.artistId ? s.artists.find((x) => x.id === b.artistId)! : null;

  const buyerRec = b.buyerKind === "venue" ? s.venues.find((x) => x.id === b.buyerId)! : s.clients.find((x) => x.id === b.buyerId)!;
  const buyer: Party = {
    name: buyerRec.name, photo: "photo" in buyerRec ? (buyerRec as DemoVenue).photo : null, hue: buyerRec.hue, kindLabel: b.buyerKind,
    phone: showContacts ? buyerRec.private.phone : null, email: showContacts ? buyerRec.private.email : null,
  };
  // The exact address of a private request stays hidden from the artist until it is confirmed (project guide §5).
  const artistSide = v.role === "artist" || v.role === "manager";
  const hideAddress = artistSide && b.source !== "slot" && !revealed;
  const { messages, ...rest } = b;
  const gross = b.contract ? b.contract.terms.price + b.contract.terms.extraSongs.reduce((n, x) => n + x.extraFee, 0) : b.quote?.price ?? b.fee;
  return {
    booking: { ...rest, address: hideAddress ? null : b.address },
    artist: a ? {
      id: a.id, slug: a.slug, name: a.name, photo: a.photo, hue: a.hue, repertoire: a.repertoire, kind: a.kind,
      contact: { name: a.name, photo: a.photo, hue: a.hue, kindLabel: "artist", phone: showContacts ? a.private.phone : null, email: showContacts ? a.private.email : null },
    } : null,
    buyer,
    messages: messages.map((m) => ({ ...m, ...visibleMessage(m.text, b.status, isAdmin) })),
    contactsRevealed: revealed,
    feeSplit: isAdmin && a && gross > 0 ? { ...splitPayment(gross, a.private.fee), bps: a.private.fee.bps } : null,
    viewerSide: isAdmin ? "admin" : artistSide ? "artist" : "buyer",
    ticketsSold: s.tickets.filter((t) => t.bookingId === b.id).reduce((n, t) => n + t.qty, 0),
    order: orderOf(s, b),
    platform: isAdmin ? platformCut(s, b, gross) : null,
  };
}

export interface BookingRow {
  id: string;
  title: string;
  date: string;
  start: string;
  city: CityId;
  status: BookingStatus;
  source: DemoBooking["source"];
  region: RegionId;
  eventType: DemoBooking["eventType"];
  counterpart: string;
  counterpartPhoto: string | null;
  price: number | null;
  unread: number;
  flagged: boolean;
  isPublic: boolean;
  ticketing: DemoBooking["ticketing"];
  sold: number;
}

export function bookingsFor(v: Viewer, opts: { region?: RegionId } = {}): BookingRow[] {
  const s = getStore();
  return s.bookings
    .filter((b) => canSeeBooking(v, b) && (!opts.region || b.region === opts.region))
    .filter((b) => !b.id.startsWith("p-") || v.role === "artist") // generated past shows only matter to the artist
    .sort((x, y) => x.date.localeCompare(y.date))
    .map((b) => {
      const a = b.artistId ? s.artists.find((x) => x.id === b.artistId) : null;
      const buyerName = b.buyerKind === "venue" ? s.venues.find((x) => x.id === b.buyerId)?.name : s.clients.find((x) => x.id === b.buyerId)?.name;
      const buyerPhoto = b.buyerKind === "venue" ? s.venues.find((x) => x.id === b.buyerId)?.photo ?? null : null;
      const artistSide = v.role === "artist" || v.role === "manager";
      return {
        id: b.id, title: b.title, date: b.date, start: b.start, city: b.city, status: b.status, source: b.source, region: b.region,
        eventType: b.eventType, flagged: b.flagged, isPublic: b.isPublic, ticketing: b.ticketing,
        counterpart: artistSide ? buyerName ?? "" : a?.name ?? "",
        counterpartPhoto: artistSide ? buyerPhoto : a?.photo ?? null,
        price: b.contract?.terms.price ?? b.quote?.price ?? (b.fee || null),
        unread: 0,
        sold: s.tickets.filter((t) => t.bookingId === b.id).reduce((n, t) => n + t.qty, 0),
      };
    });
}

/** The artist's own calendar: public bookings, private blocked days and travel windows (R2, R3). */
export function artistCalendar(artistId: string) {
  const s = getStore();
  const a = s.artists.find((x) => x.id === artistId)!;
  return {
    blocked: a.private.blockedDates,
    travel: a.travel,
    homeCity: a.homeCity,
    region: a.region,
    bookings: s.bookings
      .filter((b) => b.artistId === artistId && BOOKED_STATUSES.includes(b.status))
      .map((b) => ({ id: b.id, date: b.date, start: b.start, title: b.title, city: b.city, isPublic: b.isPublic })),
    repertoire: a.repertoire,
    fee: a.private.fee,
  };
}

export function openSlotsFor(artistId: string) {
  const s = getStore();
  const a = s.artists.find((x) => x.id === artistId)!;
  const days = dayBookings(s);
  return s.bookings
    .filter((b) => b.status === "open" && b.artistId === null && b.region === a.region && b.category === a.category && b.date >= DEMO_TODAY)
    .filter((b) => availabilityOn(toAvailability(a), b.city, b.date, days).ok)
    .map((b) => ({ id: b.id, title: b.title, date: b.date, start: b.start, city: b.city, fee: b.fee, venue: s.venues.find((v) => v.id === b.buyerId)!.name, ticketing: b.ticketing }));
}

/* ---------- admin ---------- */

export function adminArtists(region: RegionId) {
  const s = getStore();
  return s.artists.filter((a) => a.region === region).map((a) => ({
    id: a.id, slug: a.slug, name: a.name, photo: a.photo, category: a.category, homeCity: a.homeCity, rating: a.rating,
    verified: a.verified, top: a.top, fee: a.private.fee, phone: a.private.phone, email: a.private.email, internalNote: a.private.internalNote,
    upcoming: s.bookings.filter((b) => b.artistId === a.id && b.status === "confirmed" && b.date >= DEMO_TODAY).length,
  }));
}

export function adminTotals(region: RegionId) {
  const s = getStore();
  const inRegion = s.bookings.filter((b) => b.region === region && !b.id.startsWith("p-"));
  const paid = inRegion.filter((b) => b.payment);
  const gmv = paid.reduce((n, b) => n + (b.contract?.terms.price ?? b.quote?.price ?? 0), 0);
  const fees = paid.reduce((n, b) => {
    const a = s.artists.find((x) => x.id === b.artistId);
    const gross = b.contract?.terms.price ?? b.quote?.price ?? 0;
    return a && gross ? n + splitPayment(gross, a.private.fee).fee : n;
  }, 0);
  return {
    active: inRegion.filter((b) => ["new", "quoted", "pending_payment", "open"].includes(b.status)).length,
    confirmed: inRegion.filter((b) => b.status === "confirmed").length,
    flagged: inRegion.filter((b) => b.flagged).length,
    gmv, fees,
  };
}

export function demoAccounts() {
  const s = getStore();
  const staff = (ref: string | null) => s.staff.find((x) => x.id === ref);
  const name = (role: string, ref: string | null) =>
    role === "artist" ? s.artists.find((a) => a.id === ref)!.name
      : role === "venue" ? s.venues.find((v) => v.id === ref)!.name
        : role === "client" ? s.clients.find((c) => c.id === ref)!.name : staff(ref)?.name ?? "Olive Support";
  const region = (role: string, ref: string | null): RegionId | null =>
    role === "artist" ? s.artists.find((a) => a.id === ref)!.region
      : role === "venue" ? s.venues.find((v) => v.id === ref)!.region
        : role === "client" ? s.clients.find((c) => c.id === ref)!.region : staff(ref)?.region ?? null;
  const photo = (role: string, ref: string | null) =>
    role === "artist" ? s.artists.find((a) => a.id === ref)!.photo : role === "venue" ? s.venues.find((v) => v.id === ref)!.photo : null;
  return s.accounts.map((a) => ({ ...a, name: name(a.role, a.refId), region: region(a.role, a.refId), photo: photo(a.role, a.refId), staff: staff(a.refId) ?? null }));
}

/* ---------- group orders, platform rates (2026-11-07) ---------- */

const priceOf = (b: DemoBooking): number | null =>
  b.contract ? b.contract.terms.price + b.contract.terms.extraSongs.reduce((n, x) => n + x.extraFee, 0) : b.quote ? b.quote.price + b.quote.travel : null;

/** The artist has sent a quote and agreed the contract; only the deposit is missing. */
export const readyToPay = (b: DemoBooking): boolean =>
  (b.status === "quoted" || b.status === "pending_payment") && !!b.contract?.artistAcceptedAt && !b.payment;

function orderOf(s: DemoData, b: DemoBooking): BookingView["order"] {
  if (!b.orderId) return null;
  const items = s.bookings.filter((x) => x.orderId === b.orderId).map((x) => ({
    id: x.id, artist: s.artists.find((a) => a.id === x.artistId)?.name ?? "", status: x.status, price: priceOf(x), current: x.id === b.id,
  }));
  const live = items.filter((i) => !["declined", "cancelled", "closed", "rejected"].includes(i.status));
  const payable = s.bookings.filter((x) => x.orderId === b.orderId).filter(readyToPay);
  return {
    id: b.orderId, items, total: live.reduce((n, i) => n + (i.price ?? 0), 0),
    payable: { count: payable.length, deposit: payable.reduce((n, x) => n + depositAmount(priceOf(x)!, x.contract!.terms.depositPct), 0) },
  };
}

function platformCut(s: DemoData, b: DemoBooking, gross: number): BookingView["platform"] {
  const sales = s.tickets.filter((t) => t.bookingId === b.id);
  const revenue = sales.reduce((n, t) => n + t.total, 0);
  const commission = sales.reduce((n, t) => n + ticketCommission(t.total, t.kind ?? "show", s.rates), 0);
  return { customerFee: checkout(gross, s.rates, "bank").serviceFee, customerBps: s.rates.customerBps, ticketRevenue: revenue, ticketCommission: commission };
}

export function getRates(): PlatformRates {
  return { ...getStore().rates };
}

/** Olive's income so far in a region, by source (admin). */
export function platformIncome(region: RegionId) {
  const s = getStore();
  const bookings = s.bookings.filter((b) => b.region === region && !b.id.startsWith("p-"));
  const ids = new Set(bookings.map((b) => b.id));
  const tickets = s.tickets.filter((t) => ids.has(t.bookingId));
  const paid = bookings.filter((b) => b.payment);
  return {
    fromArtists: paid.reduce((n, b) => {
      const a = s.artists.find((x) => x.id === b.artistId);
      const gross = priceOf(b) ?? 0;
      return a && gross ? n + splitPayment(gross, a.private.fee).fee : n;
    }, 0),
    fromVenues: tickets.reduce((n, t) => n + ticketCommission(t.total, t.kind ?? "show", s.rates), 0),
    fromCustomers: tickets.reduce((n, t) => n + (t.serviceFee ?? 0), 0) + paid.reduce((n, b) => n + (b.payment!.serviceFee ?? 0), 0),
    cardSurcharge: tickets.reduce((n, t) => n + (t.surcharge ?? 0), 0) + paid.reduce((n, b) => n + (b.payment!.surcharge ?? 0), 0),
    ticketRevenue: tickets.reduce((n, t) => n + t.total, 0),
    comboTickets: tickets.filter((t) => t.kind === "combo").reduce((n, t) => n + t.qty, 0),
  };
}

/* ---------- venue: shows, substitutes, reservations ---------- */

/** Artists of the same kind who are free and in town that day – the venue can put one on the bill instead. */
export function substituteCandidates(bookingId: string) {
  const s = getStore();
  const b = s.bookings.find((x) => x.id === bookingId);
  if (!b) return [];
  const days = dayBookings(s);
  return s.artists
    .filter((a) => a.region === b.region)
    .filter((a) => canSubstitute(b.artistId, { id: a.id, category: a.category, free: availabilityOn(toAvailability(a), b.city, b.date, days).ok }, b.category))
    .sort((x, y) => y.rating - x.rating)
    .slice(0, 6)
    .map((a) => ({ id: a.id, name: a.name, rating: a.rating, priceMin: a.priceMin }));
}

export function venueShows(venueId: string) {
  const s = getStore();
  return s.bookings
    .filter((b) => b.buyerKind === "venue" && b.buyerId === venueId && b.ticketing && b.status === "confirmed" && b.date >= DEMO_TODAY)
    .sort((x, y) => x.date.localeCompare(y.date))
    .map((b) => {
      const tickets = s.tickets.filter((t) => t.bookingId === b.id);
      return {
        show: toShow(s, b), tickets,
        revenue: tickets.reduce((n, t) => n + t.total, 0),
        comboSold: tickets.filter((t) => t.kind === "combo").reduce((n, t) => n + t.qty, 0),
        commission: tickets.reduce((n, t) => n + ticketCommission(t.total, t.kind ?? "show", s.rates), 0),
        candidates: substituteCandidates(b.id),
        canCancel: DEMO_TODAY <= decisionDate(b.date) && !isGuaranteed(tickets.reduce((n, t) => n + t.qty, 0), b.ticketing!.capacity),
      };
    });
}

export function venueReservations(venueId: string) {
  const s = getStore();
  return s.reservations
    .filter((r) => r.venueId === venueId)
    .sort((x, y) => (x.date + x.time).localeCompare(y.date + y.time))
    .map((r) => ({ ...r, showTitle: r.bookingId ? s.bookings.find((b) => b.id === r.bookingId)?.title ?? null : null }));
}

/** Public data for the widget a restaurant embeds on its own website. */
export function embedVenue(venueId: string) {
  const s = getStore();
  const v = s.venues.find((x) => x.id === venueId);
  if (!v) return null;
  return {
    venue: { id: v.id, name: v.name, city: v.city, address: v.address, photo: v.photo, region: v.region, type: v.type },
    shows: listShows(v.region).filter((x) => x.venue.id === v.id),
  };
}

/* ---------- operators: staff, recruitment, artist managers ---------- */

export function staffList(): DemoStaff[] {
  return getStore().staff.map((x) => ({ ...x }));
}

export function leadsFor(staffId: string): DemoLead[] {
  return getStore().leads.filter((l) => l.ownerId === staffId).sort((x, y) => y.createdAt.localeCompare(x.createdAt));
}

export function allLeads(region: RegionId) {
  const s = getStore();
  return s.leads.filter((l) => l.region === region).map((l) => ({ ...l, owner: s.staff.find((x) => x.id === l.ownerId)?.name ?? "" }));
}

/** The artists a manager acts for, each with what needs attention. */
export function managerRoster(v: Viewer) {
  const s = getStore();
  return (v.staff?.roster ?? []).flatMap((id) => {
    const a = s.artists.find((x) => x.id === id);
    if (!a) return [];
    const mine = s.bookings.filter((b) => b.artistId === id && !b.id.startsWith("p-"));
    return [{
      id: a.id, slug: a.slug, name: a.name, photo: a.photo, category: a.category, homeCity: a.homeCity, rating: a.rating, region: a.region,
      pending: mine.filter((b) => b.status === "new").length,
      quoted: mine.filter((b) => b.status === "quoted" || b.status === "pending_payment").length,
      upcoming: mine.filter((b) => b.status === "confirmed" && b.date >= DEMO_TODAY).length,
      nextShow: mine.filter((b) => b.status === "confirmed" && b.date >= DEMO_TODAY).sort((x, y) => x.date.localeCompare(y.date))[0]?.date ?? null,
      trips: a.travel.filter((w) => w.to >= DEMO_TODAY),
    }];
  });
}
