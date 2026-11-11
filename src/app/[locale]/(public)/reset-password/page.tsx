import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getSessionUser } from "@/server/auth/session";
import { Alert, AuthCard } from "@/components/ui/form";
import { ResetPasswordForm } from "@/components/auth/password-forms";

/** Reached from the reset email via /api/auth/callback, which signs the user in first. */
export default async function ResetPasswordPage() {
  const t = await getTranslations("auth");
  const user = await getSessionUser();
  return (
    <AuthCard title={t("reset.title")} sub={t("reset.sub")}>
      {user ? (
        <ResetPasswordForm />
      ) : (
        <div className="space-y-4">
          <Alert tone="bad">{t("errors.linkExpired")}</Alert>
          <Link href="/forgot-password" className="block text-center text-sm font-semibold text-accent">{t("forgot.submit")}</Link>
        </div>
      )}
    </AuthCard>
  );
}
