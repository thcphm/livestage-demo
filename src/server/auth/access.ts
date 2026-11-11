import type { Role } from "@/server/db/schema";

/** Every role a signed-in user can have (same as the database enum). */
export type AppRole = Role;

/** Pure access rules, kept free of Next/Supabase imports so they can be unit tested. */

export const dashboardPath = (role: AppRole): string => `/dashboard/${role}`;

export type Access = { ok: true } | { ok: false; redirectTo: string };

/**
 * Decide whether a visitor may open a page that requires `required`.
 * Anonymous → login (returning here afterwards); wrong role → their own dashboard.
 */
export function checkAccess(role: AppRole | null, required: AppRole, currentPath: string): Access {
  if (!role) return { ok: false, redirectTo: `/login?next=${encodeURIComponent(currentPath)}` };
  if (role !== required) return { ok: false, redirectTo: dashboardPath(role) };
  return { ok: true };
}

/**
 * Only allow same-site relative redirects ("/vi/dashboard"), never "//evil.com" or "https://…".
 * Returns `fallback` for anything else.
 */
export function safeNext(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return fallback;
  return next;
}
