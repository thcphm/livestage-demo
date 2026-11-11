import { acceptContract, reviseContract } from "@/server/domain/contract";
import { DEFAULT_RATES } from "@/server/domain/fees";
import type { DemoAccount, DemoBooking, DemoData, DemoLead, DemoReservation, DemoStaff, DemoTicket } from "./types";

/*
 * Demo data for the features agreed on 2026-11-07: operator roles, artist recruitment,
 * dinner + show combos, the 50% guarantee, group orders and restaurant reservations.
 * Everyone here is fictional.
 */

export const STAFF: DemoStaff[] = [
  { id: "st-super", name: "Linh Tran", level: "super", title: { vi: "Super admin", en: "Super admin" }, region: null, hue: 150, roster: [], org: "Olive" },
  { id: "st-sup1", name: "Minh Vu", level: "support", title: { vi: "Hỗ trợ 1 · Việt Nam", en: "Support 1 · Vietnam" }, region: "vn", hue: 200, roster: [], org: "Olive" },
  { id: "st-sup2", name: "Chloe Martin", level: "support", title: { vi: "Hỗ trợ 2 · Canada", en: "Support 2 · Canada" }, region: "ca", hue: 20, roster: [], org: "Olive" },
  { id: "st-rec-ca", name: "Daniel Reyes", level: "recruiter", title: { vi: "Quản lý tuyển nghệ sĩ · Canada", en: "Recruitment manager · Canada" }, region: "ca", hue: 280, roster: [], org: "Olive talent team" },
  { id: "st-rec-vn", name: "Hoàng Nam", level: "recruiter", title: { vi: "Quản lý tuyển nghệ sĩ · Việt Nam", en: "Recruitment manager · Vietnam" }, region: "vn", hue: 40, roster: [], org: "Olive talent team" },
  { id: "st-mgr-ca", name: "Sophie Laurent", level: "manager", title: { vi: "Quản lý nghệ sĩ", en: "Artist manager" }, region: "ca", hue: 330, roster: ["a12", "a17", "a21"], org: "Northline Artists" },
  { id: "st-mgr-vn", name: "Trần Bảo Châu", level: "manager", title: { vi: "Quản lý nghệ sĩ", en: "Artist manager" }, region: "vn", hue: 100, roster: ["a1", "a5", "a23"], org: "Sài Gòn Talent" },
];

export const STAFF_ACCOUNTS: DemoAccount[] = [
  { id: "u-st-sup1", email: "support1@demo.com", role: "admin", refId: "st-sup1" },
  { id: "u-st-sup2", email: "support2@demo.com", role: "admin", refId: "st-sup2" },
  { id: "u-st-rec-ca", email: "recruit.ca@demo.com", role: "recruiter", refId: "st-rec-ca" },
  { id: "u-st-rec-vn", email: "recruit.vn@demo.com", role: "recruiter", refId: "st-rec-vn" },
  { id: "u-st-mgr-ca", email: "northline@demo.com", role: "manager", refId: "st-mgr-ca" },
  { id: "u-st-mgr-vn", email: "saigontalent@demo.com", role: "manager", refId: "st-mgr-vn" },
];

export const LEADS: DemoLead[] = [
  { id: "ld1", region: "ca", name: "Lakeshore Entertainment", kind: "agency", category: "band", city: "tor", contact: "Marcus Hale, bookings@lakeshore.example", size: 14, status: "negotiating", ownerId: "st-rec-ca", createdAt: "2026-10-12",
    notes: [{ at: "2026-10-12T10:00", text: "Agency with 14 wedding and corporate bands. Met at the Toronto wedding show." }, { at: "2026-10-27T15:30", text: "They want a 10% platform fee for the first six months. Sent to Linh for approval." }] },
  { id: "ld2", region: "ca", name: "Ava Thompson", kind: "artist", category: "singer", city: "ham", contact: "ava@avasings.example", size: 1, status: "contacted", ownerId: "st-rec-ca", createdAt: "2026-10-20",
    notes: [{ at: "2026-10-20T09:10", text: "Jazz vocalist, plays the Hamilton supper clubs. Sent the artist guide." }] },
  { id: "ld3", region: "ca", name: "Prairie Sound Collective", kind: "agency", category: "dj", city: "cal", contact: "Jo Brandt, +1 403 555 0117", size: 6, status: "new", ownerId: "st-rec-ca", createdAt: "2026-10-28", notes: [] },
  { id: "ld4", region: "ca", name: "Trio Boréal", kind: "artist", category: "band", city: "mtl", contact: "trioboreal@mail.example", size: 1, status: "signed", ownerId: "st-rec-ca", createdAt: "2026-09-30",
    notes: [{ at: "2026-10-08T11:00", text: "Signed. Profile is with support for verification." }] },
  { id: "ld5", region: "ca", name: "West Coast Strings", kind: "agency", category: "instrument", city: "van", contact: "hello@wcstrings.example", size: 9, status: "lost", ownerId: "st-rec-ca", createdAt: "2026-09-18",
    notes: [{ at: "2026-10-02T14:00", text: "Exclusive with another platform until March. Follow up in February." }] },
  { id: "ld6", region: "vn", name: "Công ty Giải trí Sao Đêm", kind: "agency", category: "singer", city: "hcm", contact: "Chị Hạnh, 0908 222 310", size: 20, status: "negotiating", ownerId: "st-rec-vn", createdAt: "2026-10-15",
    notes: [{ at: "2026-10-15T09:00", text: "Quản lý 20 ca sĩ phòng trà. Muốn một tài khoản quản lý chung cho cả nhóm." }] },
  { id: "ld7", region: "vn", name: "Ban nhạc Phố Hội", kind: "artist", category: "band", city: "dn", contact: "phohoi.band@mail.example", size: 1, status: "contacted", ownerId: "st-rec-vn", createdAt: "2026-10-22", notes: [] },
  { id: "ld8", region: "vn", name: "DJ Hà Linh", kind: "artist", category: "dj", city: "hn", contact: "0966 410 552", size: 1, status: "new", ownerId: "st-rec-vn", createdAt: "2026-10-29", notes: [] },
];

export const RESERVATIONS: DemoReservation[] = [
  { id: "rs1", venueId: "v5", bookingId: "ce1", date: "2026-11-07", time: "19:30", name: "Grace Liu", phone: "+1 416 555 0172", email: "grace@mail.example", party: 4, note: "Anniversary, a quiet table if possible.", source: "widget", status: "confirmed", at: "2026-10-27T18:20" },
  { id: "rs2", venueId: "v5", bookingId: "ce3", date: "2026-11-21", time: "19:00", name: "Omar Haddad", phone: "+1 647 555 0139", email: "omar@mail.example", party: 6, note: "", source: "widget", status: "new", at: "2026-10-29T12:05" },
  { id: "rs3", venueId: "v5", bookingId: null, date: "2026-11-10", time: "18:30", name: "Julia Werner", phone: "+1 416 555 0108", email: "julia@mail.example", party: 2, note: "No show that night, dinner only.", source: "widget", status: "new", at: "2026-10-29T20:41" },
  { id: "rs4", venueId: "v1", bookingId: "e1", date: "2026-11-06", time: "19:00", name: "Lê Quang Huy", phone: "0912 330 771", email: "huy@mail.example", party: 5, note: "Sinh nhật, cần bánh nhỏ.", source: "widget", status: "confirmed", at: "2026-10-28T09:15" },
];

/** Dinner + show combos on some ticketed shows (price in minor units of the show's region). */
const COMBOS: Record<string, { price: number; includes: { vi: string; en: string } }> = {
  ce1: { price: 8500, includes: { vi: "Bữa tối 3 món + 1 ly cocktail + chỗ ngồi gần sân khấu", en: "Three-course dinner, one cocktail and a table near the stage" } },
  ce3: { price: 10000, includes: { vi: "Bữa tối 3 món + chỗ ngồi gần sân khấu", en: "Three-course dinner and a table near the stage" } },
  h1: { price: 7500, includes: { vi: "Set tối 2 món + 1 ly vang", en: "Two-course set and a glass of wine" } },
  e1: { price: 650_000, includes: { vi: "Set tối 3 món + 1 đồ uống", en: "Three-course set and one drink" } },
  e3: { price: 700_000, includes: { vi: "Set BBQ sân thượng + 2 bia", en: "Rooftop BBQ set and two beers" } },
};

/** Extra ticket sales so the demo has shows on both sides of the 50% guarantee. */
const EXTRA_SALES: [bookingId: string, qty: number, combos: number][] = [["ce1", 44, 16], ["e1", 36, 10], ["h1", 14, 6], ["ce3", 9, 3]];

const NAMES = ["Hannah Ortiz", "Peter Novak", "Mai Anh", "Lucas Roy", "Sofia Marin", "Kenji Sato", "Thu Trang", "Noah Clarke"];

function extraTickets(bookings: DemoBooking[]): DemoTicket[] {
  const out: DemoTicket[] = [];
  for (const [bookingId, qty, combos] of EXTRA_SALES) {
    const b = bookings.find((x) => x.id === bookingId);
    if (!b?.ticketing) continue;
    const combo = b.ticketing.combo;
    let left = qty, comboLeft = combo ? combos : 0, i = 0;
    while (left > 0) {
      const n = Math.min(left, 2 + (i % 3));
      const kind = comboLeft >= n ? "combo" : "show";
      if (kind === "combo") comboLeft -= n;
      const unit = kind === "combo" ? combo!.price : b.ticketing.price;
      out.push({
        id: `tx-${bookingId}-${i}`, bookingId, code: `LS-${bookingId.toUpperCase()}${String(i).padStart(2, "0")}`, name: NAMES[i % NAMES.length],
        email: `guest${i}@mail.example`, qty: n, total: n * unit, method: i % 2 ? "card" : b.region === "ca" ? "interac" : "bank",
        at: `2026-10-${String(20 + (i % 9)).padStart(2, "0")}T1${i % 9}:15`, checkedIn: false, kind, serviceFee: 0, surcharge: 0,
      });
      left -= n;
      i++;
    }
  }
  return out;
}

/** One group order: Sarah Mitchell books a band, a DJ and a magician for the same company party. */
function groupOrder(bookings: DemoBooking[]): DemoBooking[] {
  const base = bookings.find((b) => b.id === "w4")!;
  const make = (id: string, artistId: string, category: DemoBooking["category"], status: DemoBooking["status"], price: number | null, start: string): DemoBooking => ({
    ...structuredClone(base), id, region: "ca", source: "request", groupId: null, orderId: "o1", buyerKind: "client", buyerId: "c3", artistId, category,
    title: "Mitchell & Co. holiday party", eventType: "corporate", date: "2026-12-05", start, duration: 2, city: "tor",
    address: "Steam Whistle Hall, 255 Bremner Blvd, Toronto", guests: 180, budget: 3, fee: 0, notes: "Band for dinner, magician between courses, DJ from 9:30.",
    status, flagged: false, isPublic: false, ticketing: null, setlist: [], songRequests: [], payment: null, messages: [], review: null, createdAt: "2026-10-27",
    quote: price === null ? null : { price, dur: { vi: "2 giờ", en: "2 hrs" }, equip: "", travel: 0, overtime: 0, depositPct: 30, cancel: 1, terms: "", at: "2026-10-28T10:00" },
    // Quoted artists have already sent and agreed their contract; the client only has to pay the deposit.
    contract: price === null ? null : acceptContract(reviseContract(null, { price, depositPct: 30, cancelPolicy: 1, setlist: [], extraSongs: [], licenceHolder: "client", notes: "" }, "2026-10-28T10:00"), "artist", "2026-10-28T10:00"),
    history: [{ at: "2026-10-27T16:40", text: { vi: "Khách gửi đơn nhóm 3 nghệ sĩ", en: "Client sent a group order for three artists" } }],
  });
  return [make("o1-a", "a11", "band", "quoted", 180_000, "18:30"), make("o1-b", "a15", "magic", "quoted", 90_000, "20:00"), make("o1-c", "a21", "dj", "new", null, "21:30")];
}

/** Adds the 2026-11-07 feature data to a freshly built dataset. */
export function applyOps(data: Omit<DemoData, "staff" | "leads" | "reservations" | "rates" | "refunds">): DemoData {
  for (const b of data.bookings) {
    const combo = COMBOS[b.id];
    if (combo && b.ticketing) b.ticketing.combo = structuredClone(combo);
  }
  const bookings = [...data.bookings, ...groupOrder(data.bookings)];
  return {
    ...data,
    bookings,
    tickets: [...data.tickets, ...extraTickets(bookings)],
    // The seeded admin account becomes the super admin; support, recruiters and managers get their own accounts.
    accounts: [...data.accounts.map((a) => (a.role === "admin" ? { ...a, refId: "st-super" } : a)), ...STAFF_ACCOUNTS],
    staff: structuredClone(STAFF),
    leads: structuredClone(LEADS),
    reservations: structuredClone(RESERVATIONS),
    refunds: [],
    rates: { ...DEFAULT_RATES },
  };
}
