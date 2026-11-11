import type { BookingStatus, CategoryId, CityId, EquipmentId, EventTypeId, Localized, PayMethod, RegionId, TravelArea, VenueTypeId } from "@/lib/catalog";
import type { TravelWindow } from "@/server/domain/availability";
import type { ContractVersion, SongRequest } from "@/server/domain/contract";
import type { PlatformFee, PlatformRates } from "@/server/domain/fees";
import type { Substitution } from "@/server/domain/shows";

/**
 * Demo data model. It mirrors the planned database (docs/mvp-plan.md) closely enough that pages
 * written against it only need a different data source once the database is live.
 * All money is integer minor units of the record's region (VND đồng, CAD cents).
 */

/** `recruiter` and `manager` are operator roles added on 2026-11-07 (see DemoStaff). */
export type DemoRole = "venue" | "artist" | "client" | "admin" | "recruiter" | "manager";

export interface Song {
  id: string;
  title: string;
  /** Original performer / composer, for covers. */
  original: string;
  /** Shown as a well-known song on the quick view and profile (R5). */
  signature: boolean;
}

export interface DemoTravel extends TravelWindow {
  note: Localized;
}

export interface DemoArtist {
  id: string;
  slug: string;
  region: RegionId;
  name: string;
  kind: Localized;
  category: CategoryId;
  genres: string[];
  homeCity: CityId;
  servesCities: CityId[];
  travelArea: TravelArea;
  rating: number;
  reviewsCount: number;
  bookingsCount: number;
  verified: boolean;
  top: boolean;
  response: Localized;
  priceMin: number;
  priceMax: number;
  bio: Localized;
  usp: Localized;
  eventTypes: EventTypeId[];
  packages: { name: Localized; dur: Localized; from: number }[];
  photo: string;
  gallery: string[];
  repertoire: Song[];
  travel: DemoTravel[];
  joined: number;
  hue: number;
  /** Only the artist and Olive admins see these. */
  private: {
    phone: string;
    email: string;
    payout: string;
    internalNote: string;
    /** Days the artist marked busy (private calendar, R2). */
    blockedDates: string[];
    /** Olive's fee for this artist (R4) – admin only, never shown to buyers. */
    fee: PlatformFee;
  };
}

export interface DemoVenue {
  id: string;
  region: RegionId;
  name: string;
  type: VenueTypeId;
  contact: string;
  city: CityId;
  address: string;
  photo: string;
  hue: number;
  private: { phone: string; email: string; payout: string };
}

/** Individual customer booking for a party or ceremony (R1). */
export interface DemoClient {
  id: string;
  region: RegionId;
  name: string;
  city: CityId;
  hue: number;
  private: { phone: string; email: string };
}

export type BuyerKind = "venue" | "client";

export interface DemoQuote {
  price: number;
  dur: Localized;
  equip: string;
  travel: number;
  overtime: number;
  depositPct: number;
  cancel: number;
  terms: string;
  at: string;
}

export interface DemoMessage {
  id: string;
  from: "buyer" | "artist" | "admin";
  text: string;
  at: string;
}

export interface DemoPayment {
  provider: "stripe" | "manual";
  method: PayMethod;
  depositPct: number;
  deposit: number;
  paidAt: string;
  remainingPaid: boolean;
  /** Olive's service fee and the card surcharge charged on top of the deposit. */
  serviceFee?: number;
  surcharge?: number;
}

export interface DemoBooking {
  id: string;
  region: RegionId;
  source: "slot" | "request" | "quick";
  groupId: string | null;
  /** Group order: several artists booked together for one event (all of them perform). */
  orderId?: string | null;
  buyerKind: BuyerKind;
  buyerId: string;
  artistId: string | null;
  category: CategoryId;
  title: string;
  eventType: EventTypeId;
  date: string;
  start: string;
  duration: number;
  city: CityId;
  address: string;
  guests: number;
  budget: number;
  /** Slot fee offered by the venue (slot bookings). */
  fee: number;
  equipment: EquipmentId[];
  notes: string;
  status: BookingStatus;
  flagged: boolean;
  /** Public shows appear on the artist's public schedule with venue and time (R2). */
  isPublic: boolean;
  ticketing: { price: number; capacity: number; combo?: { price: number; includes: Localized } | null } | null;
  /** Set when the venue put a substitute artist on the bill. */
  substitution?: Substitution | null;
  quote: DemoQuote | null;
  setlist: string[];
  songRequests: SongRequest[];
  contract: ContractVersion | null;
  payment: DemoPayment | null;
  messages: DemoMessage[];
  history: { at: string; text: Localized }[];
  review: { rating: number; text: string; at: string } | null;
  createdAt: string;
}

export interface DemoTicket {
  id: string;
  bookingId: string;
  code: string;
  name: string;
  email: string;
  qty: number;
  total: number;
  method: PayMethod;
  at: string;
  checkedIn: boolean;
  /** "combo" = dinner + show. */
  kind?: "show" | "combo";
  serviceFee?: number;
  surcharge?: number;
}

/** Table reservation made on the venue's own website through the embedded LiveStage widget. */
export interface DemoReservation {
  id: string;
  venueId: string;
  /** The show the guests are coming for, if any. */
  bookingId: string | null;
  date: string;
  time: string;
  name: string;
  phone: string;
  email: string;
  party: number;
  note: string;
  source: "widget" | "livestage";
  status: "new" | "confirmed" | "seated" | "cancelled";
  at: string;
}

export type StaffLevel = "super" | "support" | "recruiter" | "manager";

/** People who operate the platform: Olive admins, recruitment managers and artist managers. */
export interface DemoStaff {
  id: string;
  name: string;
  level: StaffLevel;
  title: Localized;
  region: RegionId | null;
  hue: number;
  /** Artist managers: the artists they act for. */
  roster: string[];
  /** Agency or team name shown next to the person. */
  org: string;
}

export type LeadStatus = "new" | "contacted" | "negotiating" | "signed" | "lost";

/** An artist or agency a recruiter is bringing onto the platform. */
export interface DemoLead {
  id: string;
  region: RegionId;
  name: string;
  kind: "artist" | "agency";
  category: CategoryId;
  city: CityId;
  contact: string;
  /** Artists the agency represents (1 for a solo artist). */
  size: number;
  status: LeadStatus;
  ownerId: string;
  notes: { at: string; text: string }[];
  createdAt: string;
}

export interface DemoReview {
  id: string;
  artistId: string;
  author: string;
  rating: number;
  text: string;
  date: string;
  eventType: EventTypeId;
}

export interface DemoAccount {
  id: string;
  email: string;
  role: DemoRole;
  /** Artist / venue / client / staff id. */
  refId: string | null;
  /** Set for accounts created through the register form; sample accounts share the demo password. */
  password?: string;
}

export interface DemoData {
  artists: DemoArtist[];
  venues: DemoVenue[];
  clients: DemoClient[];
  bookings: DemoBooking[];
  tickets: DemoTicket[];
  reviews: DemoReview[];
  accounts: DemoAccount[];
  staff: DemoStaff[];
  leads: DemoLead[];
  reservations: DemoReservation[];
  /** Tickets refunded because the show was cancelled or the line-up changed. They no longer count as sold. */
  refunds: (DemoTicket & { refundedAt: string; reason: "cancelled" | "lineup" })[];
  rates: PlatformRates;
}
