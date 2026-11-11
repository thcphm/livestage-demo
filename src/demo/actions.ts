"use server";

import { revalidatePath } from "next/cache";
import { getLocale } from "next-intl/server";
import { z } from "zod";
import { redirect } from "@/i18n/navigation";
import { CATEGORIES, REGIONS, type CategoryId, type CityId, type EventTypeId, type Locale, type PayMethod } from "@/lib/catalog";
import { depositAmount } from "@/lib/money";
import { isDemoMode } from "@/lib/supabase-config";
import { getSessionUser } from "@/server/auth/session";
import { matchArtists, QUICK_QUOTE_LIMIT } from "@/server/domain/availability";
import { acceptContract, acceptedExtras, invalidSetlistSongs, reviseContract, type ContractTerms } from "@/server/domain/contract";
import { checkout } from "@/server/domain/fees";
import { MAX_GUESTS_PER_SLOT, canSubstitute, decisionDate, isGuaranteed, slotLoad, tableAvailable, withinOpeningHours } from "@/server/domain/shows";
import { availabilityOn } from "@/server/domain/availability";
import { actsFor, canSeeBooking, readyToPay } from "./queries";
import { DEMO_TODAY, getStore, newId, nowIso, resetStore } from "./store";
import type { DemoBooking, LeadStatus } from "./types";

/*
 * Demo write side. Every action re-checks the viewer's role and access server-side, as the real
 * services will (project guide §4: permissions live in the service layer, never only in the UI).
 */

export type ActionState = { status: "idle" | "error"; errors?: Record<string, string>; values?: Record<string, string> };

const locale = async () => (await getLocale()) as Locale;
const refresh = () => revalidatePath("/", "layout");
const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();

function assertDemo() {
  if (!isDemoMode()) throw new Error("Demo actions are only available in demo mode");
}

async function viewer() {
  const u = await getSessionUser();
  if (!u) throw new Error("Not signed in");
  return u;
}

function booking(id: string) {
  const b = getStore().bookings.find((x) => x.id === id);
  if (!b) throw new Error("Booking not found");
  return b;
}

const log = (b: DemoBooking, vi: string, en: string) => b.history.push({ at: nowIso(), text: { vi, en } });

/* ---------- sample data ---------- */

/** Puts the sample data back to its initial state. Super admins only; accounts registered since are removed. */
export async function resetDemoData() {
  assertDemo();
  const u = await viewer();
  if (u.staff?.level !== "super") throw new Error("Only a super admin can reset the sample data");
  resetStore();
  refresh();
}

/* ---------- tickets (no account) ---------- */

export async function buyTickets(_: ActionState, formData: FormData): Promise<ActionState> {
  assertDemo();
  const s = getStore();
  const b = booking(str(formData, "show"));
  if (!b.ticketing || b.status !== "confirmed") throw new Error("Not on sale");
  const values = { name: str(formData, "name"), email: str(formData, "email"), qty: str(formData, "qty"), method: str(formData, "method"), kind: str(formData, "kind") };
  const kind = values.kind === "combo" && b.ticketing.combo ? "combo" : "show";
  const sold = s.tickets.filter((t) => t.bookingId === b.id).reduce((n, t) => n + t.qty, 0);
  const left = b.ticketing.capacity - sold;
  const qty = Number(values.qty);
  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "name";
  if (!z.email().safeParse(values.email).success) errors.email = "email";
  if (!Number.isInteger(qty) || qty < 1 || qty > 10) errors.qty = "qty";
  else if (qty > left) errors.qty = "soldOut";
  const method = (REGIONS[b.region].payMethods as string[]).includes(values.method) ? (values.method as PayMethod) : null;
  if (!method) errors.method = "qty";
  if (Object.keys(errors).length) return { status: "error", errors, values };

  // Codes are unique and hard to guess; the real version also signs the QR payload.
  let code: string;
  do code = `LS-${Math.random().toString(36).slice(2, 7).toUpperCase()}`; while (s.tickets.some((t) => t.code === code));
  // The customer pays the ticket price plus Olive's service fee, and a surcharge when paying by card.
  const bill = checkout(qty * (kind === "combo" ? b.ticketing.combo!.price : b.ticketing.price), s.rates, method!);
  s.tickets.push({
    id: newId("t"), bookingId: b.id, code, name: values.name, email: values.email.toLowerCase(), qty, total: bill.subtotal, method: method!,
    at: nowIso(), checkedIn: false, kind, serviceFee: bill.serviceFee, surcharge: bill.surcharge,
  });
  refresh();
  redirect({ href: `/tickets/${code}`, locale: await locale() });
  return { status: "idle" };
}

export async function checkInTicket(formData: FormData) {
  assertDemo();
  const u = await viewer();
  const s = getStore();
  const t = s.tickets.find((x) => x.code === str(formData, "code"));
  if (!t) return;
  const b = booking(t.bookingId);
  if (!(u.role === "admin" || (u.role === "venue" && b.buyerId === u.entityId))) throw new Error("Forbidden");
  t.checkedIn = true;
  refresh();
}

/* ---------- quote requests (venue or individual client) ---------- */

const quoteSchema = z.object({
  title: z.string().min(1).max(120),
  eventType: z.string().min(1),
  category: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.coerce.number().int().min(1).max(8),
  city: z.string().min(1),
  address: z.string().min(1).max(200),
  guests: z.coerce.number().int().min(1).max(2000),
  budget: z.coerce.number().int().min(0).max(4),
  notes: z.string().max(1000),
});

export async function submitQuoteRequest(_: ActionState, formData: FormData): Promise<ActionState> {
  assertDemo();
  const u = await viewer();
  if (u.role !== "venue" && u.role !== "client") throw new Error("Only venues and clients send requests");
  const s = getStore();
  const raw = Object.fromEntries(["title", "eventType", "category", "date", "start", "duration", "city", "address", "guests", "budget", "notes"].map((k) => [k, str(formData, k)]));
  const parsed = quoteSchema.safeParse(raw);
  const errors: Record<string, string> = {};
  if (!parsed.success) for (const i of parsed.error.issues) errors[String(i.path[0])] = i.path[0] === "guests" ? "guests" : i.path[0] === "duration" ? "duration" : "required";
  if (raw.date && raw.date < DEMO_TODAY) errors.date = "date";
  const region = u.region!;
  if (raw.city && !REGIONS[region].cities.includes(raw.city as CityId)) errors.city = "required";
  if (Object.keys(errors).length || !parsed.success) return { status: "error", errors, values: raw };
  const d = parsed.data;

  const slug = str(formData, "artist");
  const single = slug ? s.artists.find((a) => a.slug === slug && a.region === region) : undefined;
  let targets = single ? [single] : [];
  if (!single) {
    const pool = s.artists.filter((a) => a.region === region).map((a) => ({
      id: a.id, category: a.category, homeCity: a.homeCity, servesCities: a.servesCities, travel: a.travel,
      blockedDates: a.private.blockedDates, rating: a.rating, priceMin: a.priceMin, src: a,
    }));
    const days = s.bookings.map((b) => ({ artistId: b.artistId, date: b.date, holdsDay: ["pending_payment", "confirmed", "completed"].includes(b.status) }));
    const cap = REGIONS[region].budgetCaps[d.budget] ?? undefined;
    targets = matchArtists(pool, { city: d.city as CityId, date: d.date, category: d.category as CategoryId, budgetMax: cap }, days, QUICK_QUOTE_LIMIT).map((x) => x.src);
    if (!targets.length) return { status: "error", errors: { form: "noArtists" }, values: raw };
  }

  // Setlist from the artist's repertoire, plus up to three songs outside it (R6).
  const setlist = single ? formData.getAll("setlist").map(String) : [];
  if (single && invalidSetlistSongs(setlist, single.repertoire.map((x) => x.id)).length) throw new Error("Unknown song");
  const songRequests = [0, 1, 2].map((i) => ({ title: str(formData, `req${i}title`), originalArtist: str(formData, `req${i}orig`), note: str(formData, `req${i}note`) }))
    .filter((r) => r.title)
    .map((r, i) => ({ id: newId(`rq${i}`), status: "pending" as const, extraFee: 0, ...r }));

  // Group order: more artists picked for the same event. Each gets their own request; all of them are meant to perform.
  if (single) {
    const days = s.bookings.map((b) => ({ artistId: b.artistId, date: b.date, holdsDay: ["pending_payment", "confirmed", "completed"].includes(b.status) }));
    const also = formData.getAll("also").map(String).filter((id) => id !== single.id).slice(0, 5);
    for (const id of also) {
      const a = s.artists.find((x) => x.id === id && x.region === region);
      if (!a) throw new Error("Unknown artist");
      const free = availabilityOn({ id: a.id, category: a.category, homeCity: a.homeCity, servesCities: a.servesCities, travel: a.travel, blockedDates: a.private.blockedDates, rating: a.rating, priceMin: a.priceMin }, d.city as CityId, d.date, days).ok;
      if (!free) return { status: "error", errors: { form: "alsoBusy" }, values: { ...raw, busy: a.name } };
      targets.push(a);
    }
  }
  const orderId = single && targets.length > 1 ? newId("o") : null;
  const groupId = single ? null : newId("g");
  const created = targets.map((a): DemoBooking => ({
    id: newId("b"), region, source: single ? "request" : "quick", groupId, orderId, buyerKind: u.role as "venue" | "client", buyerId: u.entityId!,
    artistId: a.id, category: orderId ? a.category : (d.category as CategoryId), title: d.title, eventType: d.eventType as EventTypeId, date: d.date, start: d.start,
    duration: d.duration, city: d.city as CityId, address: d.address, guests: d.guests, budget: d.budget, fee: 0, equipment: [], notes: d.notes,
    status: "new", flagged: false, isPublic: false, ticketing: null, quote: null,
    // The setlist and extra songs belong to the artist the request was opened for.
    setlist: a.id === targets[0].id ? setlist : [], songRequests: a.id === targets[0].id ? structuredClone(songRequests) : [], contract: null,
    payment: null, messages: [], history: [{ at: nowIso(), text: orderId ? { vi: `Khách gửi đơn nhóm ${targets.length} nghệ sĩ`, en: `Group order for ${targets.length} artists sent` } : single ? { vi: "Khách gửi yêu cầu", en: "Request sent" } : { vi: "Khách gửi Quick Free Quote", en: "Quick Free Quote sent" } }],
    review: null, createdAt: DEMO_TODAY,
  }));
  s.bookings.push(...created);
  refresh();
  redirect({ href: `/dashboard/bookings/${created[0].id}`, locale: await locale() });
  return { status: "idle" };
}

/* ---------- artist side ---------- */

function termsFor(b: DemoBooking, a = getStore().artists.find((x) => x.id === b.artistId)!): ContractTerms {
  const q = b.quote!;
  return {
    price: q.price + q.travel, depositPct: q.depositPct, cancelPolicy: q.cancel,
    setlist: b.setlist.filter((id) => a.repertoire.some((s) => s.id === id)), extraSongs: acceptedExtras(b.songRequests),
    licenceHolder: b.buyerKind === "venue" ? "venue" : "client", notes: q.terms,
  };
}

/** New terms → new contract version; the artist proposing it counts as their acceptance. */
function reviseByArtist(b: DemoBooking) {
  if (!b.quote) return;
  const before = b.contract?.version;
  b.contract = acceptContract(reviseContract(b.contract, termsFor(b), nowIso()), "artist", nowIso());
  if (b.contract.version !== before && before) log(b, `Hợp đồng v${b.contract.version}`, `Contract v${b.contract.version}`);
}

async function asArtistOf(id: string) {
  const u = await viewer();
  const b = booking(id);
  if (!actsFor(u, b.artistId)) throw new Error("Forbidden");
  return b;
}

async function asBuyerOf(id: string) {
  const u = await viewer();
  const b = booking(id);
  if (!(u.role === "venue" || u.role === "client") || b.buyerKind !== u.role || b.buyerId !== u.entityId) throw new Error("Forbidden");
  return b;
}

export async function sendQuote(formData: FormData) {
  assertDemo();
  const b = await asArtistOf(str(formData, "booking"));
  if (!["new", "quoted"].includes(b.status)) return;
  const price = Number(str(formData, "price"));
  if (!Number.isInteger(price) || price <= 0) return;
  const minorPrice = b.region === "ca" ? price * 100 : price;
  b.quote = {
    price: minorPrice, dur: { vi: `${b.duration} giờ`, en: `${b.duration} hrs` }, equip: str(formData, "equip"), travel: 0,
    overtime: 0, depositPct: Math.min(50, Math.max(0, Number(str(formData, "deposit")) || 30)), cancel: Math.min(2, Math.max(0, Number(str(formData, "cancel")) || 0)),
    terms: str(formData, "terms"), at: nowIso(),
  };
  b.status = "quoted";
  reviseByArtist(b);
  log(b, "Nghệ sĩ gửi báo giá và hợp đồng", "Artist sent a quote and contract");
  refresh();
}

export async function declineRequest(formData: FormData) {
  assertDemo();
  const b = await asArtistOf(str(formData, "booking"));
  if (!["new", "quoted"].includes(b.status)) return;
  b.status = "declined";
  log(b, "Nghệ sĩ từ chối", "Artist declined");
  refresh();
}

export async function respondSongRequest(formData: FormData) {
  assertDemo();
  const b = await asArtistOf(str(formData, "booking"));
  const r = b.songRequests.find((x) => x.id === str(formData, "request"));
  if (!r || ["confirmed", "completed", "cancelled"].includes(b.status)) return;
  const accept = str(formData, "decision") === "accept";
  const fee = Number(str(formData, "fee") || "0");
  r.status = accept ? "accepted" : "declined";
  r.extraFee = accept && Number.isFinite(fee) && fee > 0 ? (b.region === "ca" ? Math.round(fee * 100) : Math.round(fee)) : 0;
  log(b, `${accept ? "Nhận" : "Không nhận"} bài “${r.title}”`, `${accept ? "Accepted" : "Declined"} “${r.title}”`);
  reviseByArtist(b);
  refresh();
}

export async function acceptSlot(formData: FormData) {
  assertDemo();
  const u = await viewer();
  const b = booking(str(formData, "booking"));
  if (u.role !== "artist" || b.status !== "open" || b.artistId) return;
  const s = getStore();
  const a = s.artists.find((x) => x.id === u.entityId)!;
  // Same transaction rule as the real service: never two shows on one day.
  if (s.bookings.some((x) => x.artistId === a.id && x.date === b.date && ["pending_payment", "confirmed", "completed"].includes(x.status))) return;
  b.artistId = a.id;
  b.status = "confirmed";
  log(b, `${a.name} nhận show (1-click)`, `${a.name} accepted the show (1-click)`);
  refresh();
}

/* ---------- buyer side ---------- */

export async function acceptQuote(formData: FormData) {
  assertDemo();
  const b = await asBuyerOf(str(formData, "booking"));
  if (b.status !== "quoted" || !b.quote) return;
  if (!b.contract) reviseByArtist(b);
  b.contract = acceptContract(b.contract!, "buyer", nowIso());
  b.status = "pending_payment";
  log(b, "Khách chấp nhận báo giá và hợp đồng", "Booker accepted the quote and contract");
  refresh();
}

export async function acceptContractAction(formData: FormData) {
  assertDemo();
  const u = await viewer();
  const b = booking(str(formData, "booking"));
  if (!b.contract) return;
  const side = actsFor(u, b.artistId) ? "artist" : (u.role === b.buyerKind && b.buyerId === u.entityId) ? "buyer" : null;
  if (!side) throw new Error("Forbidden");
  b.contract = acceptContract(b.contract, side, nowIso());
  log(b, `${side === "buyer" ? "Khách" : "Nghệ sĩ"} đồng ý hợp đồng v${b.contract.version}`, `${side === "buyer" ? "Booker" : "Artist"} agreed to contract v${b.contract.version}`);
  refresh();
}

/** Deposit through Olive (Stripe in the real build): confirms the booking and closes the rest of a Quick Quote group. */
export async function payDeposit(formData: FormData) {
  assertDemo();
  const b = await asBuyerOf(str(formData, "booking"));
  if (!["quoted", "pending_payment"].includes(b.status) || !b.contract || !b.contract.artistAcceptedAt) return;
  settleDeposit(b, str(formData, "method"));
  refresh();
}

/** One payment for every artist in a group order whose quote and contract are ready. */
export async function payOrder(formData: FormData) {
  assertDemo();
  const u = await viewer();
  const orderId = str(formData, "order");
  const mine = getStore().bookings.filter((b) => b.orderId === orderId && b.buyerKind === u.role && b.buyerId === u.entityId);
  if (!orderId || !mine.length) throw new Error("Forbidden");
  for (const b of mine.filter(readyToPay)) settleDeposit(b, str(formData, "method"));
  refresh();
}

function settleDeposit(b: DemoBooking, chosen: string) {
  if (!b.contract) return;
  b.contract = acceptContract(b.contract, "buyer", nowIso());
  const total = b.contract.terms.price + b.contract.terms.extraSongs.reduce((n, x) => n + x.extraFee, 0);
  const deposit = depositAmount(total, b.contract.terms.depositPct);
  const method = (REGIONS[b.region].payMethods as string[]).includes(chosen) && chosen !== "cash" ? (chosen as PayMethod) : "card";
  const bill = checkout(deposit, getStore().rates, method);
  b.payment = { provider: "stripe", method, depositPct: b.contract.terms.depositPct, deposit, paidAt: nowIso(), remainingPaid: false, serviceFee: bill.serviceFee, surcharge: bill.surcharge };
  b.status = "confirmed";
  log(b, `Khách đặt cọc ${b.contract.terms.depositPct}% qua Olive – đã chốt`, `Booker paid a ${b.contract.terms.depositPct}% deposit through Olive – confirmed`);
  if (b.groupId) {
    for (const other of getStore().bookings.filter((x) => x.groupId === b.groupId && x.id !== b.id && ["new", "quoted", "pending_payment"].includes(x.status))) {
      other.status = "closed";
      log(other, "Khách đã chọn nghệ sĩ khác", "Booker chose another artist");
    }
  }
}

/* ---------- messages (R7) ---------- */

export async function sendMessage(formData: FormData) {
  assertDemo();
  const u = await viewer();
  const b = booking(str(formData, "booking"));
  if (!canSeeBooking(u, b) || (u.role === "artist" && b.artistId !== u.entityId)) throw new Error("Forbidden");
  const text = str(formData, "text").slice(0, 2000);
  if (!text) return;
  // The original is stored; masking happens when it is shown (admins can always read it).
  b.messages.push({ id: newId("m"), from: u.role === "admin" ? "admin" : u.role === "artist" || u.role === "manager" ? "artist" : "buyer", text, at: nowIso() });
  refresh();
}

/* ---------- artist calendar, trips, repertoire (R2, R3, R5) ---------- */

async function ownArtist() {
  const u = await viewer();
  if (u.role !== "artist") throw new Error("Forbidden");
  return getStore().artists.find((a) => a.id === u.entityId)!;
}

export async function toggleBlockedDate(formData: FormData) {
  assertDemo();
  const a = await ownArtist();
  const date = str(formData, "date");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return;
  const list = a.private.blockedDates;
  a.private.blockedDates = list.includes(date) ? list.filter((d) => d !== date) : [...list, date].sort();
  refresh();
}

export async function addTrip(formData: FormData) {
  assertDemo();
  const a = await ownArtist();
  const from = str(formData, "from");
  const to = str(formData, "to");
  const city = str(formData, "city") as CityId;
  if (!from || !to || from > to || from < DEMO_TODAY || !REGIONS[a.region].cities.includes(city) || city === a.homeCity) return;
  if (a.travel.some((w) => !(to < w.from || from > w.to))) return; // no overlapping trips
  const note = str(formData, "note").slice(0, 120);
  a.travel = [...a.travel, { from, to, city, note: { vi: note, en: note } }].sort((x, y) => x.from.localeCompare(y.from));
  refresh();
}

export async function removeTrip(formData: FormData) {
  assertDemo();
  const a = await ownArtist();
  a.travel = a.travel.filter((w) => w.from !== str(formData, "from"));
  refresh();
}

export async function toggleSignature(formData: FormData) {
  assertDemo();
  const a = await ownArtist();
  const song = a.repertoire.find((x) => x.id === str(formData, "song"));
  if (song) song.signature = !song.signature;
  refresh();
}

export async function addSong(formData: FormData) {
  assertDemo();
  const a = await ownArtist();
  const title = str(formData, "title").slice(0, 120);
  if (!title) return;
  a.repertoire.push({ id: `${a.id}-s${a.repertoire.length + 1}-${Date.now().toString(36)}`, title, original: str(formData, "original").slice(0, 120), signature: false });
  refresh();
}

/* ---------- venue ---------- */

export async function createSlot(formData: FormData) {
  assertDemo();
  const u = await viewer();
  if (u.role !== "venue") throw new Error("Forbidden");
  const s = getStore();
  const v = s.venues.find((x) => x.id === u.entityId)!;
  const date = str(formData, "date");
  const category = str(formData, "category");
  const fee = Number(str(formData, "fee"));
  if (!date || date < DEMO_TODAY || !CATEGORIES.some((c) => c.id === category) || !Number.isFinite(fee) || fee <= 0) return;
  const minor = (n: number) => (v.region === "ca" ? Math.round(n * 100) : Math.round(n));
  const ticketing = formData.get("ticketing") === "on"
    ? { price: minor(Number(str(formData, "ticketPrice")) || 0), capacity: Math.max(1, Number(str(formData, "capacity")) || 50) } : null;
  s.bookings.push({
    id: newId("s"), region: v.region, source: "slot", groupId: null, buyerKind: "venue", buyerId: v.id, artistId: null,
    category: category as CategoryId, title: str(formData, "title") || "Live music", eventType: v.type === "bar" ? "bar" : "restaurant",
    date, start: str(formData, "start") || "20:00", duration: Math.min(5, Math.max(1, Number(str(formData, "duration")) || 2)), city: v.city,
    address: v.address, guests: ticketing?.capacity ?? 50, budget: 1, fee: minor(fee), equipment: [], notes: "", status: "open", flagged: false,
    isPublic: true, ticketing, quote: null, setlist: [], songRequests: [], contract: null, payment: null, messages: [],
    history: [{ at: nowIso(), text: { vi: "Nhà hàng mở slot", en: "Venue opened a slot" } }], review: null, createdAt: DEMO_TODAY,
  });
  refresh();
}

/* ---------- admin (R4) ---------- */

async function asAdmin() {
  const u = await viewer();
  if (u.role !== "admin") throw new Error("Forbidden");
  return u;
}

/** Fees and rates are money decisions: only a super admin changes them; support staff can read them. */
async function asSuperAdmin() {
  const u = await asAdmin();
  if (u.staff?.level !== "super") throw new Error("Only a super admin can change fees");
}

export async function toggleFlag(formData: FormData) {
  assertDemo();
  await asAdmin();
  const b = booking(str(formData, "booking"));
  b.flagged = !b.flagged;
  refresh();
}

export async function setArtistFee(formData: FormData) {
  assertDemo();
  await asSuperAdmin();
  const a = getStore().artists.find((x) => x.id === str(formData, "artist"));
  if (!a) return;
  const pct = Number(str(formData, "pct"));
  const min = Number(str(formData, "min") || "0");
  if (!Number.isFinite(pct) || pct < 0 || pct > 50 || !Number.isFinite(min) || min < 0) return;
  a.private.fee = { bps: Math.round(pct * 100), minimum: a.region === "ca" ? Math.round(min * 100) : Math.round(min) };
  refresh();
}

/** Platform-wide rates: what Olive takes from venues, customers and combo tickets, and the card surcharge. */
export async function setRates(formData: FormData) {
  assertDemo();
  await asSuperAdmin();
  const rates = getStore().rates;
  for (const key of ["artistBps", "venueBps", "customerBps", "cardBps", "comboBps"] as const) {
    const pct = Number(str(formData, key));
    if (Number.isFinite(pct) && pct >= 0 && pct <= 50) rates[key] = Math.round(pct * 100);
  }
  refresh();
}

/* ---------- venue: combo tickets, substitute artist, reservations (2026-11-07) ---------- */

async function ownShow(id: string) {
  const u = await viewer();
  const b = booking(id);
  if (u.role !== "venue" || b.buyerKind !== "venue" || b.buyerId !== u.entityId || !b.ticketing) throw new Error("Forbidden");
  return b;
}

/** Dinner + show combo next to the show-only ticket. A price of 0 removes it. */
export async function setCombo(formData: FormData) {
  assertDemo();
  const b = await ownShow(str(formData, "booking"));
  const price = Number(str(formData, "price"));
  const includes = str(formData, "includes").slice(0, 160);
  if (!Number.isFinite(price) || price <= 0) b.ticketing!.combo = null;
  else {
    const minor = b.region === "ca" ? Math.round(price * 100) : Math.round(price);
    if (minor <= b.ticketing!.price) return; // a combo is the show plus a meal, so it cannot cost less than the show
    b.ticketing!.combo = { price: minor, includes: { vi: includes, en: includes } };
  }
  refresh();
}

/** The venue puts another artist of the same kind on the bill. Ticket holders keep their tickets and see the change. */
export async function substituteArtist(formData: FormData) {
  assertDemo();
  const b = await ownShow(str(formData, "booking"));
  if (b.status !== "confirmed" || b.date < DEMO_TODAY) return;
  const s = getStore();
  const next = s.artists.find((a) => a.id === str(formData, "artist") && a.region === b.region);
  if (!next) return;
  const days = s.bookings.map((x) => ({ artistId: x.artistId, date: x.date, holdsDay: ["pending_payment", "confirmed", "completed"].includes(x.status) }));
  const free = availabilityOn({ id: next.id, category: next.category, homeCity: next.homeCity, servesCities: next.servesCities, travel: next.travel, blockedDates: next.private.blockedDates, rating: next.rating, priceMin: next.priceMin }, b.city, b.date, days).ok;
  if (!canSubstitute(b.artistId, { id: next.id, category: next.category, free }, b.category)) return;
  const prev = s.artists.find((a) => a.id === b.artistId);
  // Keep the first artist as "from" if the bill changes more than once.
  b.substitution = { fromArtistId: b.substitution?.fromArtistId ?? b.artistId ?? next.id, toArtistId: next.id, reason: str(formData, "reason").slice(0, 200), at: nowIso() };
  b.artistId = next.id;
  if (prev) b.title = b.title.includes(prev.name) ? b.title.replace(prev.name, next.name) : b.title;
  log(b, `Đổi nghệ sĩ: ${prev?.name ?? ""} → ${next.name}. Khách đã mua vé được báo qua email.`, `Line-up change: ${prev?.name ?? ""} replaced by ${next.name}. Ticket holders were emailed.`);
  refresh();
}

/** Table reservation from the widget on the restaurant's own website. No account needed. */
export async function createReservation(_: ActionState, formData: FormData): Promise<ActionState> {
  assertDemo();
  const s = getStore();
  const venue = s.venues.find((v) => v.id === str(formData, "venue"));
  if (!venue) throw new Error("Unknown venue");
  const values = Object.fromEntries(["name", "phone", "email", "date", "time", "party", "note", "show"].map((k) => [k, str(formData, k)]));
  const errors: Record<string, string> = {};
  if (!values.name) errors.name = "name";
  if (!z.email().safeParse(values.email).success) errors.email = "email";
  if (values.phone.replace(/\D/g, "").length < 7) errors.phone = "phone";
  const party = Number(values.party);
  if (!Number.isInteger(party) || party < 1 || party > 20) errors.party = "party";
  const show = values.show ? s.bookings.find((b) => b.id === values.show && b.buyerId === venue.id && b.ticketing) : undefined;
  const date = show?.date ?? values.date;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < DEMO_TODAY) errors.date = "date";
  const time = values.time || "19:00";
  if (!withinOpeningHours(time)) errors.time = "time";
  // Never seat more guests in one hour than the venue takes through the widget.
  else if (!errors.date && !errors.party && !tableAvailable(slotLoad(s.reservations.filter((r) => r.venueId === venue.id), date, time), party)) errors.time = "full";
  if (Object.keys(errors).length) return { status: "error", errors, values: { ...values, max: String(MAX_GUESTS_PER_SLOT) } };
  const id = newId("rs");
  s.reservations.push({
    id, venueId: venue.id, bookingId: show?.id ?? null, date, time, name: values.name, phone: values.phone,
    email: values.email.toLowerCase(), party, note: values.note.slice(0, 300), source: "widget", status: "new", at: nowIso(),
  });
  refresh();
  redirect({ href: `/embed/venue/${venue.id}?reserved=${id}`, locale: await locale() });
  return { status: "idle" };
}

export async function setReservationStatus(formData: FormData) {
  assertDemo();
  const u = await viewer();
  const r = getStore().reservations.find((x) => x.id === str(formData, "reservation"));
  if (!r || u.role !== "venue" || r.venueId !== u.entityId) throw new Error("Forbidden");
  const status = str(formData, "status");
  if (status === "confirmed" || status === "seated" || status === "cancelled") r.status = status;
  refresh();
}

/* ---------- recruitment (2026-11-07) ---------- */

const LEAD_STATUSES: LeadStatus[] = ["new", "contacted", "negotiating", "signed", "lost"];

async function asRecruiter() {
  const u = await viewer();
  if (u.role !== "recruiter") throw new Error("Forbidden");
  return u;
}

export async function addLead(formData: FormData) {
  assertDemo();
  const u = await asRecruiter();
  const name = str(formData, "name").slice(0, 120);
  const city = str(formData, "city") as CityId;
  const category = str(formData, "category");
  if (!name || !u.region || !REGIONS[u.region].cities.includes(city) || !CATEGORIES.some((c) => c.id === category)) return;
  const kind = str(formData, "kind") === "agency" ? "agency" : "artist";
  getStore().leads.push({
    id: newId("ld"), region: u.region, name, kind, category: category as CategoryId, city, contact: str(formData, "contact").slice(0, 160),
    size: kind === "agency" ? Math.min(500, Math.max(2, Number(str(formData, "size")) || 2)) : 1, status: "new", ownerId: u.entityId!, notes: [], createdAt: DEMO_TODAY,
  });
  refresh();
}

export async function updateLead(formData: FormData) {
  assertDemo();
  const u = await asRecruiter();
  const lead = getStore().leads.find((l) => l.id === str(formData, "lead"));
  if (!lead || lead.ownerId !== u.entityId) throw new Error("Forbidden");
  const status = str(formData, "status") as LeadStatus;
  if (LEAD_STATUSES.includes(status) && status !== lead.status) {
    lead.status = status;
    lead.notes.push({ at: nowIso(), text: status === "signed" ? "Signed. Account invite sent; profile goes to Olive support for verification." : `Status: ${status}` });
  }
  const note = str(formData, "note").slice(0, 400);
  if (note) lead.notes.push({ at: nowIso(), text: note });
  refresh();
}

/* ---------- cancelling an under-sold show, ticket refunds ---------- */

/** Below the 50% guarantee the venue may still call the show off; every ticket is refunded in full. */
export async function cancelShow(formData: FormData) {
  assertDemo();
  const b = await ownShow(str(formData, "booking"));
  // Ticket holders need notice: after the decision date the show goes ahead as sold.
  if (b.status !== "confirmed" || DEMO_TODAY > decisionDate(b.date)) return;
  const s = getStore();
  const sold = s.tickets.filter((t) => t.bookingId === b.id);
  if (isGuaranteed(sold.reduce((n, t) => n + t.qty, 0), b.ticketing!.capacity)) return; // a guaranteed show goes ahead
  s.refunds.push(...sold.map((t) => ({ ...t, refundedAt: nowIso(), reason: "cancelled" as const })));
  s.tickets = s.tickets.filter((t) => t.bookingId !== b.id);
  b.status = "cancelled";
  log(b, `Nhà hàng huỷ show (chưa đạt 50%). Hoàn tiền ${sold.length} đơn vé.`, `Venue cancelled the show (under 50% sold). ${sold.length} ticket orders refunded.`);
  refresh();
}

/** After a line-up change a ticket holder may take a full refund until the day before the show. No account needed. */
export async function refundTicket(formData: FormData) {
  assertDemo();
  const s = getStore();
  const t = s.tickets.find((x) => x.code === str(formData, "code"));
  if (!t || t.checkedIn) return;
  const b = booking(t.bookingId);
  if (!b.substitution || b.date <= DEMO_TODAY) return;
  s.refunds.push({ ...t, refundedAt: nowIso(), reason: "lineup" });
  s.tickets = s.tickets.filter((x) => x.id !== t.id);
  refresh();
}
