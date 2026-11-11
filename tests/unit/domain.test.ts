import { describe, expect, it } from "vitest";
import { availabilityOn, cityOn, matchArtists, type AvailabilityArtist, type DayBooking } from "@/server/domain/availability";
import { publicSchedule, splitByDate, type ScheduleBooking } from "@/server/domain/schedule";
import { CONTACT_MASK, maskContacts, visibleMessage } from "@/server/domain/messaging";
import { splitPayment } from "@/server/domain/fees";
import { acceptContract, contractState, invalidSetlistSongs, reviseContract, totalWithExtras, type ContractTerms } from "@/server/domain/contract";

const artist = (over: Partial<AvailabilityArtist> = {}): AvailabilityArtist => ({
  id: "a1", category: "singer", homeCity: "tor", servesCities: ["mis"], travel: [], blockedDates: [], rating: 4.8, priceMin: 50_000, ...over,
});

describe("availability (R3)", () => {
  const touring = artist({ travel: [{ from: "2026-12-10", to: "2026-12-15", city: "ham" }] });

  it("puts the artist in the travel window's city for those days only", () => {
    expect(cityOn(touring, "2026-12-09")).toBe("tor");
    expect(cityOn(touring, "2026-12-10")).toBe("ham");
    expect(cityOn(touring, "2026-12-15")).toBe("ham");
    expect(cityOn(touring, "2026-12-16")).toBe("tor");
  });

  it("is bookable in Hamilton during the trip but not at home", () => {
    expect(availabilityOn(touring, "ham", "2026-12-12", [])).toEqual({ ok: true, reason: "travel" });
    expect(availabilityOn(touring, "tor", "2026-12-12", [])).toEqual({ ok: false });
    expect(availabilityOn(touring, "ham", "2026-12-20", [])).toEqual({ ok: false });
  });

  it("respects served cities, blocked days and existing bookings", () => {
    const booked: DayBooking[] = [{ artistId: "a1", date: "2026-11-07", holdsDay: true }];
    const a = artist({ blockedDates: ["2026-11-08"] });
    expect(availabilityOn(a, "mis", "2026-11-06", booked)).toEqual({ ok: true, reason: "serves" });
    expect(availabilityOn(a, "tor", "2026-11-07", booked).ok).toBe(false);
    expect(availabilityOn(a, "tor", "2026-11-08", booked).ok).toBe(false);
    // A request that does not hold the day leaves it free.
    expect(availabilityOn(a, "tor", "2026-11-07", [{ artistId: "a1", date: "2026-11-07", holdsDay: false }]).ok).toBe(true);
  });

  it("ranks local artists before travelling ones, then by rating, and filters by budget", () => {
    const list = [
      artist({ id: "local-low", rating: 4.5 }),
      artist({ id: "visitor", homeCity: "ott", servesCities: [], rating: 5, travel: [{ from: "2026-12-01", to: "2026-12-31", city: "tor" }] }),
      artist({ id: "local-high", rating: 4.9 }),
      artist({ id: "pricey", rating: 5, priceMin: 500_000 }),
    ];
    const ids = matchArtists(list, { city: "tor", date: "2026-12-12", budgetMax: 100_000 }, []).map((a) => a.id);
    expect(ids).toEqual(["local-high", "local-low", "visitor"]);
    expect(matchArtists(list, { city: "tor" }, [], 2)).toHaveLength(2);
  });
});

describe("public schedule (R2)", () => {
  const b = (over: Partial<ScheduleBooking>): ScheduleBooking => ({
    id: "e", artistId: "a1", date: "2026-11-06", start: "20:00", city: "hcm", status: "confirmed", isPublic: true, title: "Show", venueName: "The Jazz Corner", ...over,
  });

  it("shows public shows in full and private events as city only", () => {
    const items = publicSchedule("a1", [
      b({ id: "e2", date: "2026-11-09", isPublic: false, title: "Tiệc cưới Minh & Lan", venueName: null }),
      b({ id: "e1" }),
      b({ id: "e3", status: "new" }),
      b({ id: "e4", artistId: "a2" }),
    ]);
    expect(items).toEqual([
      { kind: "show", bookingId: "e1", date: "2026-11-06", start: "20:00", city: "hcm", title: "Show", venueName: "The Jazz Corner" },
      { kind: "private", date: "2026-11-09", city: "hcm" },
    ]);
    expect(JSON.stringify(items)).not.toContain("Minh");
  });

  it("splits upcoming and recent items", () => {
    const { upcoming, past } = splitByDate([{ date: "2026-10-01" }, { date: "2026-10-20" }, { date: "2026-11-02" }], "2026-10-30");
    expect(upcoming.map((x) => x.date)).toEqual(["2026-11-02"]);
    expect(past.map((x) => x.date)).toEqual(["2026-10-20", "2026-10-01"]);
  });
});

describe("message masking (R7)", () => {
  it("hides phones, emails, links and handles", () => {
    const { text, masked } = maskContacts("Gọi em 0909 318 112 hoặc mail thaovy@demo.com, ig @thaovy.sings, web www.thaovy.vn, zalo.me/0909");
    expect(masked).toBe(true);
    expect(text).not.toMatch(/0909|thaovy|demo\.com|www\./);
    expect(text).toContain(CONTACT_MASK);
  });

  it("keeps ordinary numbers like times, prices and guest counts", () => {
    const msg = "Show 20:00 ngày 14/11, 120 khách, giá 3.500.000đ";
    expect(maskContacts(msg)).toEqual({ text: msg, masked: false });
  });

  it("reveals the original once confirmed, and always to admins", () => {
    expect(visibleMessage("0909 318 112", "quoted", false).masked).toBe(true);
    expect(visibleMessage("0909 318 112", "confirmed", false)).toEqual({ text: "0909 318 112", masked: false });
    expect(visibleMessage("0909 318 112", "quoted", true).masked).toBe(false);
  });
});

describe("platform fee (R4)", () => {
  it("takes the percentage, at least the minimum, never more than the total", () => {
    expect(splitPayment(3_500_000, { bps: 1200, minimum: 0 })).toEqual({ gross: 3_500_000, fee: 420_000, payout: 3_080_000 });
    expect(splitPayment(10_000, { bps: 1000, minimum: 2_500 })).toEqual({ gross: 10_000, fee: 2_500, payout: 7_500 });
    expect(splitPayment(1_000, { bps: 1000, minimum: 5_000 }).payout).toBe(0);
    expect(() => splitPayment(10.5, { bps: 1000, minimum: 0 })).toThrow();
  });
});

describe("setlist and contract (R6)", () => {
  const terms: ContractTerms = {
    price: 3_500_000, depositPct: 30, cancelPolicy: 1, setlist: ["s1", "s2"],
    extraSongs: [{ title: "Hello", originalArtist: "Adele", extraFee: 300_000 }], licenceHolder: "venue", notes: "",
  };

  it("validates the setlist against the repertoire", () => {
    expect(invalidSetlistSongs(["s1", "x9"], ["s1", "s2"])).toEqual(["x9"]);
  });

  it("adds accepted song fees to the total", () => {
    expect(totalWithExtras(terms)).toBe(3_800_000);
  });

  it("needs both sides to accept, and changed terms reset acceptance", () => {
    let c = reviseContract(null, terms, "2026-10-30T10:00");
    expect(c.version).toBe(1);
    expect(contractState(c)).toBe("awaiting_both");
    c = acceptContract(c, "buyer", "t1");
    expect(contractState(c)).toBe("awaiting_artist");
    c = acceptContract(c, "artist", "t2");
    expect(contractState(c)).toBe("signed");
    expect(reviseContract(c, { ...terms }, "t3")).toBe(c);
    const v2 = reviseContract(c, { ...terms, setlist: ["s2"] }, "t3");
    expect(v2.version).toBe(2);
    expect(contractState(v2)).toBe("awaiting_both");
  });
});

/* ---------- 2026-11-07: platform rates, card surcharge, 50% guarantee ---------- */

describe("checkout (service fee and card surcharge)", () => {
  const rates = { customerBps: 300, cardBps: 290 };
  it("adds the service fee, and the surcharge only for card payments", async () => {
    const { checkout } = await import("@/server/domain/fees");
    expect(checkout(10_000, rates, "interac")).toEqual({ subtotal: 10_000, serviceFee: 300, surcharge: 0, total: 10_300 });
    // Surcharge applies to subtotal + service fee: 10,300 × 2.9% = 298.7 → 299.
    expect(checkout(10_000, rates, "card")).toEqual({ subtotal: 10_000, serviceFee: 300, surcharge: 299, total: 10_599 });
  });
  it("charges nothing extra when both rates are zero", async () => {
    const { checkout } = await import("@/server/domain/fees");
    expect(checkout(4_000, { customerBps: 0, cardBps: 0 }, "card").total).toBe(4_000);
  });
  it("takes the combo rate on dinner + show tickets and the venue rate otherwise", async () => {
    const { ticketCommission } = await import("@/server/domain/fees");
    const r = { venueBps: 500, comboBps: 1000 };
    expect(ticketCommission(10_000, "show", r)).toBe(500);
    expect(ticketCommission(10_000, "combo", r)).toBe(1_000);
  });
});

describe("show guarantee and substitutes", () => {
  it("guarantees a show at half the seats", async () => {
    const { isGuaranteed, ticketsToGuarantee } = await import("@/server/domain/shows");
    expect(isGuaranteed(44, 90)).toBe(false);
    expect(isGuaranteed(45, 90)).toBe(true);
    expect(ticketsToGuarantee(11, 90)).toBe(34);
    expect(ticketsToGuarantee(60, 90)).toBe(0);
    expect(ticketsToGuarantee(0, 61)).toBe(31); // odd capacity rounds up
  });
  it("only accepts a different, free artist of the same kind", async () => {
    const { canSubstitute } = await import("@/server/domain/shows");
    expect(canSubstitute("a1", { id: "a2", category: "singer", free: true }, "singer")).toBe(true);
    expect(canSubstitute("a1", { id: "a1", category: "singer", free: true }, "singer")).toBe(false);
    expect(canSubstitute("a1", { id: "a2", category: "dj", free: true }, "singer")).toBe(false);
    expect(canSubstitute("a1", { id: "a2", category: "singer", free: false }, "singer")).toBe(false);
  });
});

describe("under-sold shows and table reservations", () => {
  it("lets the venue decide until three days before the show", async () => {
    const { decisionDate } = await import("@/server/domain/shows");
    expect(decisionDate("2026-11-21")).toBe("2026-11-18");
    expect(decisionDate("2026-12-02")).toBe("2026-11-29"); // crosses a month
  });
  it("takes tables only inside opening hours", async () => {
    const { withinOpeningHours } = await import("@/server/domain/shows");
    expect(withinOpeningHours("11:00")).toBe(true);
    expect(withinOpeningHours("22:30")).toBe(true);
    expect(withinOpeningHours("10:59")).toBe(false);
    expect(withinOpeningHours("23:00")).toBe(false);
    expect(withinOpeningHours("7pm")).toBe(false);
  });
  it("never seats more than the slot allows, ignoring cancelled reservations", async () => {
    const { MAX_GUESTS_PER_SLOT, slotLoad, tableAvailable } = await import("@/server/domain/shows");
    const rs = [
      { date: "2026-11-12", time: "19:00", party: 30, status: "confirmed" },
      { date: "2026-11-12", time: "19:30", party: 6, status: "new" },
      { date: "2026-11-12", time: "19:15", party: 10, status: "cancelled" },
      { date: "2026-11-12", time: "20:00", party: 8, status: "new" },
      { date: "2026-11-13", time: "19:00", party: 20, status: "new" },
    ];
    expect(slotLoad(rs, "2026-11-12", "19:45")).toBe(36);
    expect(tableAvailable(36, MAX_GUESTS_PER_SLOT - 36)).toBe(true);
    expect(tableAvailable(36, MAX_GUESTS_PER_SLOT - 35)).toBe(false);
  });
});
