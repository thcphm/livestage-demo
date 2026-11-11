import "server-only";
import type { RegionId } from "@/lib/catalog";
import type { RegisterInput } from "@/server/auth/validation";
import { slugify } from "@/server/auth/validation";
import { getRates } from "./queries";
import { getStore, newId } from "./store";
import type { DemoAccount } from "./types";

/*
 * Sign-in for demo mode: the bundled sample accounts share one password, and accounts created through
 * the register form keep their own. Everything lives in the in-memory store and resets with it.
 */

/** Password of every bundled sample account. Override with DEMO_PASSWORD. */
export const demoPassword = (): string => process.env.DEMO_PASSWORD || "livestage2026";

const sameEmail = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export function findDemoLogin(email: string, password: string): DemoAccount | null {
  const account = getStore().accounts.find((a) => sameEmail(a.email, email));
  if (!account) return null;
  return password === (account.password ?? demoPassword()) ? account : null;
}

export function demoAccountRegion(account: DemoAccount): RegionId | null {
  const s = getStore();
  return (account.role === "artist" ? s.artists.find((a) => a.id === account.refId)?.region
    : account.role === "venue" ? s.venues.find((v) => v.id === account.refId)?.region
      : account.role === "client" ? s.clients.find((c) => c.id === account.refId)?.region
        : s.staff.find((x) => x.id === account.refId)?.region) ?? null;
}

/** Creates the account and its artist, venue or client record. Returns null when the email is taken. */
export function registerDemoAccount(input: RegisterInput): DemoAccount | null {
  const s = getStore();
  if (s.accounts.some((a) => sameEmail(a.email, input.email))) return null;
  const hue = Math.floor(Math.random() * 360);
  let refId: string;

  if (input.role === "artist") {
    // Presentation defaults come from an existing act of the same kind; the artist fills in the rest later.
    const like = s.artists.find((a) => a.category === input.category && a.region === input.region) ?? s.artists.find((a) => a.category === input.category) ?? s.artists[0];
    refId = newId("a");
    let slug = slugify(input.name);
    if (s.artists.some((a) => a.slug === slug)) slug = `${slug}-${refId.slice(-4)}`;
    s.artists.push({
      id: refId, slug, region: input.region, name: input.name, kind: like.kind, category: input.category, genres: [],
      homeCity: input.city, servesCities: [], travelArea: "local", rating: 0, reviewsCount: 0, bookingsCount: 0, verified: false, top: false,
      response: like.response, priceMin: like.priceMin, priceMax: like.priceMax, bio: { vi: "", en: "" }, usp: { vi: "", en: "" },
      eventTypes: like.eventTypes, packages: [], photo: like.photo, gallery: [], repertoire: [], travel: [], joined: new Date().getFullYear(), hue,
      private: { phone: "", email: input.email, payout: "", internalNote: "", blockedDates: [], fee: { bps: getRates().artistBps, minimum: 0 } },
    });
  } else if (input.role === "venue") {
    const like = s.venues.find((v) => v.type === input.venueType) ?? s.venues[0];
    refId = newId("v");
    s.venues.push({
      id: refId, region: input.region, name: input.business, type: input.venueType, contact: input.name, city: input.city,
      address: "", photo: like.photo, hue, private: { phone: "", email: input.email, payout: "" },
    });
  } else {
    refId = newId("c");
    s.clients.push({ id: refId, region: input.region, name: input.name, city: input.city, hue, private: { phone: "", email: input.email } });
  }

  const account: DemoAccount = { id: `u-${refId}`, email: input.email, role: input.role, refId, password: input.password };
  s.accounts.push(account);
  return account;
}
