import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { BOOKED_STATUSES, CITIES, REGIONS } from "@/lib/catalog";
import { cityOn, travelOn } from "@/server/domain/availability";
import { invalidSetlistSongs } from "@/server/domain/contract";
import { buildDemoData, seedTime } from "@/demo/data";

const data = buildDemoData();
const photo = (p: string) => existsSync(join(process.cwd(), "public", p));

describe("demo data", () => {
  it("converts seed timestamps", () => {
    expect(seedTime("27/10 10:12")).toBe("2026-10-27T10:12");
    expect(seedTime("11/10/2026")).toBe("2026-10-11T00:00");
  });

  it("has unique ids, slugs and account emails", () => {
    const uniq = (xs: string[]) => new Set(xs).size === xs.length;
    expect(uniq(data.artists.map((a) => a.id))).toBe(true);
    expect(uniq(data.artists.map((a) => a.slug))).toBe(true);
    expect(uniq(data.bookings.map((b) => b.id))).toBe(true);
    expect(uniq(data.accounts.map((a) => a.email))).toBe(true);
    expect(data.artists.length).toBeGreaterThanOrEqual(28);
  });

  it("gives every artist and venue a photo that exists, and a repertoire with well-known songs", () => {
    for (const a of data.artists) {
      expect(photo(a.photo), a.photo).toBe(true);
      for (const g of a.gallery) expect(photo(g), g).toBe(true);
      expect(a.repertoire.some((s) => s.signature), a.name).toBe(true);
    }
    for (const v of data.venues) expect(photo(v.photo), v.name).toBe(true);
  });

  it("keeps cities and travel windows inside the artist's region", () => {
    for (const a of data.artists) {
      expect(REGIONS[a.region].cities).toContain(a.homeCity);
      for (const c of a.servesCities) expect(CITIES[c].region).toBe(a.region);
      for (const w of a.travel) {
        expect(CITIES[w.city].region).toBe(a.region);
        expect(w.from <= w.to).toBe(true);
      }
    }
  });

  it("never books an artist twice on the same day", () => {
    const seen = new Set<string>();
    for (const b of data.bookings.filter((x) => x.artistId && BOOKED_STATUSES.includes(x.status))) {
      const key = `${b.artistId}|${b.date}`;
      expect(seen.has(key), key).toBe(false);
      seen.add(key);
    }
  });

  it("places bookings during a trip in the trip's city (R3)", () => {
    for (const b of data.bookings.filter((x) => x.artistId && x.status !== "completed")) {
      const a = data.artists.find((x) => x.id === b.artistId)!;
      if (travelOn(a, b.date)) expect(b.city, b.id).toBe(cityOn(a, b.date));
    }
  });

  it("only uses repertoire songs in setlists and contracts (R6)", () => {
    for (const b of data.bookings.filter((x) => x.artistId)) {
      const ids = data.artists.find((x) => x.id === b.artistId)!.repertoire.map((s) => s.id);
      expect(invalidSetlistSongs(b.setlist, ids), b.id).toEqual([]);
      if (b.contract) expect(invalidSetlistSongs(b.contract.terms.setlist, ids), b.id).toEqual([]);
    }
  });

  it("links every booking to an existing buyer, in the buyer's region", () => {
    for (const b of data.bookings) {
      const buyer = b.buyerKind === "venue" ? data.venues.find((v) => v.id === b.buyerId) : data.clients.find((c) => c.id === b.buyerId);
      expect(buyer, b.id).toBeTruthy();
      expect(buyer!.region).toBe(b.region);
    }
  });

  it("has individual clients with bookings (R1) and a per-artist platform fee (R4)", () => {
    expect(data.bookings.filter((b) => b.buyerKind === "client").length).toBeGreaterThanOrEqual(4);
    for (const a of data.artists) expect(a.private.fee.bps).toBeGreaterThan(0);
  });
});
