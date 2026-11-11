import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { eq } from "drizzle-orm";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { CityId, Locale, RegionId } from "@/lib/catalog";
import { isDemoMode, isSupabaseConfigured } from "@/lib/supabase-config";
import { getDb } from "@/server/db/client";
import { artists, profiles, venues, type Role } from "@/server/db/schema";
import { createSupabaseServer } from "@/server/supabase";
import { getStore } from "@/demo/store";
import type { StaffLevel } from "@/demo/types";
import { checkAccess, type AppRole } from "./access";

export interface SessionUser {
  userId: string;
  email: string;
  role: AppRole;
  /** Artist, venue, client or staff id. */
  entityId: string | null;
  displayName: string;
  hue: number;
  photo: string | null;
  region: RegionId | null;
  city: CityId | null;
  /** Only for artists: whether Olive has approved the profile. */
  artistStatus: "pending" | "active" | "suspended" | null;
  /** Operators only: Olive admin level, recruiter or artist manager, and the artists a manager acts for. */
  staff?: { level: StaffLevel; org: string; roster: string[] } | null;
}

/** Cookie holding the signed-in sample account (demo mode only). */
export const DEMO_ACCOUNT_COOKIE = "ls_demo_account";

async function getDemoUser(): Promise<SessionUser | null> {
  const id = (await cookies()).get(DEMO_ACCOUNT_COOKIE)?.value;
  const store = getStore();
  const account = id ? store.accounts.find((a) => a.id === id) : undefined;
  if (!account) return null;
  const base = { userId: account.id, email: account.email, role: account.role, entityId: account.refId, artistStatus: null };
  if (account.role === "artist") {
    const a = store.artists.find((x) => x.id === account.refId)!;
    return { ...base, displayName: a.name, hue: a.hue, photo: a.photo, region: a.region, city: a.homeCity, artistStatus: "active" };
  }
  if (account.role === "venue") {
    const v = store.venues.find((x) => x.id === account.refId)!;
    return { ...base, displayName: v.name, hue: v.hue, photo: v.photo, region: v.region, city: v.city };
  }
  if (account.role === "client") {
    const c = store.clients.find((x) => x.id === account.refId)!;
    return { ...base, displayName: c.name, hue: c.hue, photo: null, region: c.region, city: c.city };
  }
  const st = store.staff.find((x) => x.id === account.refId);
  if (st) return { ...base, displayName: st.name, hue: st.hue, photo: null, region: st.region, city: null, staff: { level: st.level, org: st.org, roster: st.roster } };
  return { ...base, displayName: "Olive Support", hue: 200, photo: null, region: null, city: null, staff: { level: "super", org: "Olive", roster: [] } };
}

/** The signed-in user with their role and profile, or null. Cached per request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isDemoMode()) return getDemoUser();
  if (!isSupabaseConfigured()) return null;
  const supabase = await createSupabaseServer();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims?.sub) return null;

  const db = getDb();
  const [row] = await db
    .select({
      role: profiles.role,
      artistId: artists.id, artistName: artists.name, artistHue: artists.hue, artistRegion: artists.region, artistCity: artists.city, artistStatus: artists.status,
      venueId: venues.id, venueName: venues.businessName, venueHue: venues.hue, venueRegion: venues.region, venueCity: venues.city,
    })
    .from(profiles)
    .leftJoin(artists, eq(artists.userId, profiles.userId))
    .leftJoin(venues, eq(venues.userId, profiles.userId))
    .where(eq(profiles.userId, claims.sub))
    .limit(1);
  // An auth user without a profile (e.g. sign-up rolled back) has no access to the app.
  if (!row) return null;

  const base = { userId: claims.sub, email: String(claims.email ?? ""), role: row.role, photo: null };
  if (row.role === "artist") {
    return { ...base, entityId: row.artistId, displayName: row.artistName ?? "", hue: row.artistHue ?? 200,
      region: row.artistRegion, city: row.artistCity as CityId | null, artistStatus: row.artistStatus };
  }
  if (row.role === "venue") {
    return { ...base, entityId: row.venueId, displayName: row.venueName ?? "", hue: row.venueHue ?? 200,
      region: row.venueRegion, city: row.venueCity as CityId | null, artistStatus: null };
  }
  return { ...base, entityId: null, displayName: "Olive Support", hue: 200, region: null, city: null, artistStatus: null };
});

/** Role and region of a user id, or null when the user has no profile. */
export async function getAccountSummary(userId: string): Promise<{ role: Role; region: RegionId | null } | null> {
  const [row] = await getDb()
    .select({ role: profiles.role, artistRegion: artists.region, venueRegion: venues.region })
    .from(profiles)
    .leftJoin(artists, eq(artists.userId, profiles.userId))
    .leftJoin(venues, eq(venues.userId, profiles.userId))
    .where(eq(profiles.userId, userId))
    .limit(1);
  return row ? { role: row.role, region: row.artistRegion ?? row.venueRegion } : null;
}

/** Use at the top of a role-only layout or page; redirects when the visitor may not enter. */
export async function requireRole(required: AppRole, currentPath: string): Promise<SessionUser> {
  const user = await getSessionUser();
  const access = checkAccess(user?.role ?? null, required, currentPath);
  if (!access.ok) {
    redirect({ href: access.redirectTo, locale: (await getLocale()) as Locale });
  }
  return user!;
}
