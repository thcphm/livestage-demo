/** Pure env checks shared by middleware, session and demo mode (no server-only imports). */

// Placeholder values copied from .env.example ("https://<project-ref>.supabase.co") count as "not configured".
export const isSupabaseConfigured = (): boolean =>
  /^https:\/\/[\w.-]+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") && !!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * Demo mode serves the bundled demo data (src/demo) instead of the database, with sample accounts
 * instead of real sign-in. On when DEMO_MODE=1, or automatically while Supabase is not configured.
 */
export const isDemoMode = (): boolean => process.env.DEMO_MODE === "1" || !isSupabaseConfigured();
