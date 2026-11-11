import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog";
import { dashboardPath, safeNext } from "@/server/auth/access";
import { getSessionUser } from "@/server/auth/session";
import { isDemoMode } from "@/lib/supabase-config";
import { AuthCard } from "@/components/ui/form";
import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const { next, error } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect({ href: safeNext(next, dashboardPath(user.role)), locale: (await getLocale()) as Locale });

  const t = await getTranslations("auth.login");
  return (
    <AuthCard title={t("title")} sub={t("sub")}>
      <LoginForm next={safeNext(next, "") || undefined} linkError={error === "link"} passwordOnly={isDemoMode()} />
    </AuthCard>
  );
}
