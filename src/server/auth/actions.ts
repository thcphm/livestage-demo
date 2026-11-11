"use server";

import { cookies, headers } from "next/headers";
import { hasLocale } from "next-intl";
import { redirect } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import type { Locale } from "@/lib/catalog";
import { createAccountRecords } from "@/server/services/accounts";
import { createSupabaseAdmin, createSupabaseServer } from "@/server/supabase";
import { serverEnv } from "@/server/env";
import { setRegion } from "@/lib/actions";
import { isDemoMode } from "@/lib/supabase-config";
import { demoAccountRegion, findDemoLogin, registerDemoAccount } from "@/demo/auth";
import type { DemoAccount } from "@/demo/types";
import { DEMO_ACCOUNT_COOKIE, getAccountSummary, getSessionUser } from "./session";
import { dashboardPath, safeNext } from "./access";
import { emailOnlySchema, fieldErrors, loginSchema, newPasswordSchema, registerSchema } from "./validation";

/** Result shown by auth forms. Error strings are keys under `auth.errors`. */
export interface FormState {
  status: "idle" | "error" | "sent";
  fieldErrors?: Record<string, string>;
  formError?: string;
  /** Echo of the submitted values so the form keeps them after an error (never the password). */
  values?: Record<string, string>;
}

const formLocale = (fd: FormData): Locale => {
  const l = fd.get("locale");
  return hasLocale(routing.locales, l) ? l : routing.defaultLocale;
};

const values = (fd: FormData) =>
  Object.fromEntries([...fd.entries()].filter(([k, v]) => typeof v === "string" && k !== "password" && !k.startsWith("$")).map(([k, v]) => [k, String(v)]));

/** Absolute URL of our auth callback, which then forwards to `next` (a localized path). */
async function callbackUrl(next: string): Promise<string> {
  const origin = (await headers()).get("origin") ?? serverEnv().NEXT_PUBLIC_SITE_URL;
  return `${origin}/api/auth/callback?next=${encodeURIComponent(next)}`;
}

/** Demo mode: the session is a cookie naming the account in the in-memory store. */
async function startDemoSession(account: DemoAccount): Promise<void> {
  (await cookies()).set(DEMO_ACCOUNT_COOKIE, account.id, { path: "/", sameSite: "lax", httpOnly: true, maxAge: 60 * 60 * 24 * 30 });
  const region = demoAccountRegion(account);
  if (region) await setRegion(region);
}

export async function signIn(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const parsed = loginSchema.safeParse({ email: fd.get("email"), password: fd.get("password") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: values(fd) };

  if (isDemoMode()) {
    const account = findDemoLogin(parsed.data.email, parsed.data.password);
    if (!account) return { status: "error", formError: "invalidCredentials", values: values(fd) };
    await startDemoSession(account);
    redirect({ href: safeNext(fd.get("next"), dashboardPath(account.role)), locale });
    return { status: "idle" };
  }

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    const formError = error.code === "email_not_confirmed" ? "emailNotConfirmed" : "invalidCredentials";
    return { status: "error", formError, values: values(fd) };
  }
  const account = await getAccountSummary(data.user.id);
  if (!account) {
    await supabase.auth.signOut();
    return { status: "error", formError: "noProfile", values: values(fd) };
  }
  // Show the site in the account's own region, as the demo does.
  if (account.region) await setRegion(account.region);
  redirect({ href: safeNext(fd.get("next"), dashboardPath(account.role)), locale });
  return { status: "idle" };
}

export async function sendMagicLink(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const parsed = emailOnlySchema.safeParse({ email: fd.get("email") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: values(fd) };
  if (isDemoMode()) return { status: "error", formError: "unknown", values: values(fd) };

  const supabase = await createSupabaseServer();
  // shouldCreateUser: false — accounts are only created through registration.
  // The result is ignored on purpose so the form never reveals whether an email has an account.
  await supabase.auth.signInWithOtp({
    email: parsed.data.email,
    options: { shouldCreateUser: false, emailRedirectTo: await callbackUrl(`/${locale}/dashboard`) },
  });
  return { status: "sent", values: values(fd) };
}

export async function register(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const parsed = registerSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: values(fd) };
  const input = parsed.data;

  if (isDemoMode()) {
    const account = registerDemoAccount(input);
    if (!account) return { status: "error", formError: "emailTaken", values: values(fd) };
    await startDemoSession(account);
    redirect({ href: dashboardPath(account.role), locale });
    return { status: "idle" };
  }
  // Individual clients sign up in demo mode only until the database has a table for them.
  if (input.role === "client") return { status: "error", formError: "unknown", values: values(fd) };

  const supabase = await createSupabaseServer();
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: { emailRedirectTo: await callbackUrl(`/${locale}/dashboard`), data: { role: input.role, locale } },
  });
  if (error) {
    const formError = error.code === "user_already_exists" || error.code === "email_exists" ? "emailTaken"
      : error.code === "weak_password" ? "passwordWeak"
      : error.code === "over_email_send_rate_limit" ? "rateLimited"
      : "unknown";
    return { status: "error", formError, values: values(fd) };
  }
  // With email confirmation on, an existing email comes back as a user without identities.
  if (!data.user || data.user.identities?.length === 0) return { status: "error", formError: "emailTaken", values: values(fd) };

  try {
    await createAccountRecords(data.user.id, input, locale);
  } catch (e) {
    // Roll back the auth user so the email can be used again.
    await createSupabaseAdmin().auth.admin.deleteUser(data.user.id);
    console.error("register: creating account records failed", e);
    return { status: "error", formError: "unknown", values: values(fd) };
  }

  await setRegion(input.region);
  if (!data.session) return { status: "sent", values: values(fd) };
  redirect({ href: dashboardPath(input.role), locale });
  return { status: "idle" };
}

export async function requestPasswordReset(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const parsed = emailOnlySchema.safeParse({ email: fd.get("email") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error), values: values(fd) };
  if (isDemoMode()) return { status: "error", formError: "unknown", values: values(fd) };

  const supabase = await createSupabaseServer();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, { redirectTo: await callbackUrl(`/${locale}/reset-password`) });
  return { status: "sent", values: values(fd) };
}

export async function updatePassword(_: FormState, fd: FormData): Promise<FormState> {
  const locale = formLocale(fd);
  const parsed = newPasswordSchema.safeParse({ password: fd.get("password") });
  if (!parsed.success) return { status: "error", fieldErrors: fieldErrors(parsed.error) };

  const user = await getSessionUser();
  if (!user) return { status: "error", formError: "linkExpired" };
  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { status: "error", formError: error.code === "same_password" ? "samePassword" : "unknown" };
  redirect({ href: dashboardPath(user.role), locale });
  return { status: "idle" };
}

export async function signOut(fd: FormData): Promise<void> {
  if (isDemoMode()) {
    (await cookies()).delete(DEMO_ACCOUNT_COOKIE);
    redirect({ href: "/", locale: formLocale(fd) });
    return;
  }
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect({ href: "/", locale: formLocale(fd) });
}
