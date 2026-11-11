import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog";
import { dashboardPath } from "@/server/auth/access";
import { getSessionUser } from "@/server/auth/session";
import { getRegion } from "@/lib/region";
import { isDemoMode } from "@/lib/supabase-config";
import { AuthCard } from "@/components/ui/form";
import { RegisterForm } from "@/components/auth/register-form";

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ role?: string }> }) {
  const { role } = await searchParams;
  const user = await getSessionUser();
  if (user) redirect({ href: dashboardPath(user.role), locale: (await getLocale()) as Locale });

  const t = await getTranslations("auth.register");
  return (
    <AuthCard title={t("title")} sub={t("sub")}>
      <RegisterForm initialRole={role === "artist" ? "artist" : role === "client" && isDemoMode() ? "client" : "venue"} initialRegion={await getRegion()} allowClient={isDemoMode()} />
    </AuthCard>
  );
}
