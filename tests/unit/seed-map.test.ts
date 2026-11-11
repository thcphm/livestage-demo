import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { mapArtist, mapVenue, toMinorUnits, type SeedFile } from "@/server/seed/map";
import { CITIES } from "@/lib/catalog";

const seed: SeedFile = JSON.parse(readFileSync(new URL("../../docs/demo/seed.json", import.meta.url), "utf8"));

describe("toMinorUnits", () => {
  it("converts CAD dollars to cents and keeps VND", () => {
    expect(toMinorUnits(650, "ca")).toBe(65_000);
    expect(toMinorUnits(3_500_000, "vn")).toBe(3_500_000);
  });
});

describe("seed.json mapping", () => {
  it("has an account for every artist and venue", () => {
    const refs = new Set(seed.accounts.map((a) => a.refId));
    for (const x of [...seed.artists, ...seed.venues]) expect(refs.has(x.id), x.id).toBe(true);
    expect(seed.accounts.filter((a) => a.role === "admin")).toHaveLength(1);
  });

  it("maps a CAD artist's money to cents", () => {
    const ca = seed.artists.find((a) => a.region === "ca")!;
    const m = mapArtist(ca);
    expect(m.artist.priceMin).toBe(ca.priceMin * 100);
    expect(m.artist.defaultFee).toBe(ca.fee * 100);
    expect(m.packages[0].priceFrom).toBe(ca.packages[0].from * 100);
  });

  it("keeps private fields out of the public artist row", () => {
    const m = mapArtist(seed.artists[0]);
    expect(m.artist).not.toHaveProperty("phone");
    expect(m.artist).not.toHaveProperty("payAccount");
    expect(m.priv.email).toBe(seed.artists[0].email);
  });

  it("gives every artist a unique slug and a city in its region", () => {
    const slugs = seed.artists.map((a) => mapArtist(a).artist.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const a of seed.artists) expect(CITIES[a.city as keyof typeof CITIES].region).toBe(a.region);
  });

  it("maps venues with their private contact separately", () => {
    const m = mapVenue(seed.venues[0]);
    expect(m.venue.businessName).toBe(seed.venues[0].business);
    expect(m.priv.phone).toBe(seed.venues[0].phone);
    expect(m.venue).not.toHaveProperty("phone");
  });
});
