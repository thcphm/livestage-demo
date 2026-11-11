import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { routing } from "@/i18n/routing";
import { safeNext } from "@/server/auth/access";
import { createSupabaseServer } from "@/server/supabase";

/**
 * Landing point for links in auth emails (confirm sign-up, magic link, password reset).
 * Exchanges the code or token for a session, then forwards to `next` (a localized path).
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const next = safeNext(searchParams.get("next"), `/${routing.defaultLocale}/dashboard`);
  const locale = next.split("/")[1] || routing.defaultLocale;

  const supabase = await createSupabaseServer();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;

  const { error } = code
    ? await supabase.auth.exchangeCodeForSession(code)
    : tokenHash && type
      ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type })
      : { error: new Error("missing code") };

  if (error) return NextResponse.redirect(new URL(`/${locale}/login?error=link`, origin));
  return NextResponse.redirect(new URL(next, origin));
}
