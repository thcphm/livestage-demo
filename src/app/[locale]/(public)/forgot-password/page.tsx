import { getLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog";
import { isDemoMode } from "@/lib/supabase-config";
import { AuthCard } from "@/components/ui/form";
import { ForgotPasswordForm } from "@/components/auth/password-forms";

export default async function ForgotPasswordPage() {
  // No email service in demo mode, so there is nothing to send a reset link with.
  if (isDemoMode()) redirect({ href: "/login", locale: (await getLocale()) as Locale });
  const t = await getTranslations("auth.forgot");
  return (
    <AuthCard title={t("title")} sub={t("sub")}>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
