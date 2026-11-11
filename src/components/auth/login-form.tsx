"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { sendMagicLink, signIn, type FormState } from "@/server/auth/actions";
import { Alert, Field, Input } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const idle: FormState = { status: "idle" };

/** `passwordOnly` hides the email-link tab and the reset link (demo mode has no email service). */
export function LoginForm({ next, linkError, passwordOnly = false }: { next?: string; linkError?: boolean; passwordOnly?: boolean }) {
  const t = useTranslations("auth");
  const locale = useLocale();
  const [tab, setTab] = useState<"password" | "magic">("password");
  const [pwState, pwAction, pwPending] = useActionState(signIn, idle);
  const [mlState, mlAction, mlPending] = useActionState(sendMagicLink, idle);
  const err = (k?: string) => (k ? t(`errors.${k}`) : undefined);

  return (
    <div>
      {!passwordOnly && <div className="grid grid-cols-2 gap-1 rounded-lg bg-surface2 p-1 mb-5 text-sm font-medium" role="tablist">
        {(["password", "magic"] as const).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} onClick={() => setTab(k)}
            className={`rounded-md py-1.5 ${tab === k ? "bg-surface shadow-sm" : "text-muted"}`}>
            {k === "password" ? t("login.tabPassword") : t("login.tabMagic")}
          </button>
        ))}
      </div>}

      {linkError && <div className="mb-4"><Alert tone="bad">{t("login.linkError")}</Alert></div>}

      {tab === "password" ? (
        <form action={pwAction} className="space-y-4" noValidate>
          <input type="hidden" name="locale" value={locale} />
          {next && <input type="hidden" name="next" value={next} />}
          <Field label={t("login.email")} error={err(pwState.fieldErrors?.email)}>
            <Input name="email" type="email" autoComplete="email" required defaultValue={pwState.values?.email} invalid={!!pwState.fieldErrors?.email} />
          </Field>
          <Field label={t("login.password")} error={err(pwState.fieldErrors?.password)}>
            <Input name="password" type="password" autoComplete="current-password" required invalid={!!pwState.fieldErrors?.password} />
          </Field>
          {pwState.formError && <Alert tone="bad">{err(pwState.formError)}</Alert>}
          <Button type="submit" size="lg" className="w-full" disabled={pwPending}>{pwPending ? t("pending") : t("login.submit")}</Button>
          {!passwordOnly && <div className="text-center"><Link href="/forgot-password" className="text-sm font-medium text-accent">{t("login.forgot")}</Link></div>}
        </form>
      ) : (
        <form action={mlAction} className="space-y-4" noValidate>
          <input type="hidden" name="locale" value={locale} />
          <p className="text-sm text-muted">{t("login.magicHint")}</p>
          <Field label={t("login.email")} error={err(mlState.fieldErrors?.email)}>
            <Input name="email" type="email" autoComplete="email" required defaultValue={mlState.values?.email} invalid={!!mlState.fieldErrors?.email} />
          </Field>
          {mlState.status === "sent" && <Alert tone="ok">{t("login.magicSent")}</Alert>}
          <Button type="submit" size="lg" className="w-full" disabled={mlPending}>{mlPending ? t("pending") : t("login.magicSubmit")}</Button>
        </form>
      )}

      <p className="mt-6 pt-5 border-t border-line text-center text-sm text-muted">
        {t("login.noAccount")} <Link href="/register" className="font-medium text-accent">{t("login.registerLink")}</Link>
      </p>
    </div>
  );
}
