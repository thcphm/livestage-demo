"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { requestPasswordReset, updatePassword, type FormState } from "@/server/auth/actions";
import { Alert, Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const idle: FormState = { status: "idle" };

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, action, pending] = useActionState(requestPasswordReset, idle);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Field label={t("login.email")} error={state.fieldErrors?.email && t(`errors.${state.fieldErrors.email}`)}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state.values?.email} invalid={!!state.fieldErrors?.email} />
      </Field>
      {state.status === "sent" && <Alert tone="ok">{t("forgot.sent")}</Alert>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? t("pending") : t("forgot.submit")}</Button>
      <div className="text-center"><Link href="/login" className="text-sm font-medium text-accent">{t("forgot.back")}</Link></div>
    </form>
  );
}

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [state, action, pending] = useActionState(updatePassword, idle);
  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <Field label={t("reset.password")} hint={t("register.passwordHint")} error={state.fieldErrors?.password && t(`errors.${state.fieldErrors.password}`)}>
        <Input name="password" type="password" autoComplete="new-password" invalid={!!state.fieldErrors?.password} />
      </Field>
      {state.formError && <Alert tone="bad">{t(`errors.${state.formError}`)}</Alert>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{pending ? t("pending") : t("reset.submit")}</Button>
    </form>
  );
}
