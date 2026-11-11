"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { register, type FormState } from "@/server/auth/actions";
import { CATEGORIES, CITIES, REGIONS, VENUE_TYPES, loc, type Locale, type RegionId } from "@/lib/catalog";
import { Alert, Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const idle: FormState = { status: "idle" };
type Role = "venue" | "artist" | "client";

/** `allowClient` adds the individual-client option (demo mode only for now). */
export function RegisterForm({ initialRole, initialRegion, allowClient = false }: { initialRole: Role; initialRegion: RegionId; allowClient?: boolean }) {
  const t = useTranslations("auth");
  const locale = useLocale() as Locale;
  const [state, action, pending] = useActionState(register, idle);
  const v = state.values ?? {};
  const [role, setRole] = useState<Role>((v.role as Role) || initialRole);
  const [region, setRegion] = useState<RegionId>((v.region as RegionId) || initialRegion);
  const fe = state.fieldErrors ?? {};
  const err = (k?: string) => (k ? t(`errors.${k}`) : undefined);

  if (state.status === "sent") {
    return (
      <div className="text-center py-2">
        <div className="text-lg font-semibold">{t("register.sentTitle")}</div>
        <p className="text-sm text-muted mt-1">{t("register.sentText", { email: v.email ?? "" })}</p>
      </div>
    );
  }

  const cityOptions = REGIONS[region].cities.map((c) => ({ value: c, label: loc(CITIES[c].name, locale) }));

  return (
    <form action={action} className="space-y-4" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="role" value={role} />
      <div className={`grid gap-2 ${allowClient ? "sm:grid-cols-3" : "grid-cols-2"}`}>
        {([["client", t("register.roleClient"), t("register.roleClientDesc")], ["venue", t("register.roleVenue"), t("register.roleVenueDesc")], ["artist", t("register.roleArtist"), t("register.roleArtistDesc")]] as const).filter(([k]) => allowClient || k !== "client").map(([k, l, d]) => (
          <button key={k} type="button" onClick={() => setRole(k)} aria-pressed={role === k}
            className={`rounded-lg border p-3 text-left ${role === k ? "border-ink bg-surface2" : "border-line"}`}>
            <div className="font-semibold">{l}</div>
            <div className="text-xs text-muted">{d}</div>
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label={t("register.region")} error={err(fe.region)}>
          <Select name="region" value={region} onChange={(e) => setRegion(e.target.value as RegionId)}
            options={Object.values(REGIONS).map((r) => ({ value: r.id, label: loc(r.name, locale) }))} />
        </Field>
        <Field label={t("register.city")} error={err(fe.city)}>
          {/* key resets the selection when the region changes */}
          <Select key={region} name="city" defaultValue={v.region === region ? v.city : undefined} options={cityOptions} invalid={!!fe.city} />
        </Field>
      </div>

      {role === "client" ? (
        <Field label={t("register.clientName")} error={err(fe.name)}>
          <Input name="name" autoComplete="name" defaultValue={v.name} invalid={!!fe.name} />
        </Field>
      ) : role === "artist" ? (
        <div className="grid grid-cols-2 gap-3">
          <Field label={t("register.artistName")} error={err(fe.name)}>
            <Input name="name" autoComplete="nickname" defaultValue={v.name} invalid={!!fe.name} />
          </Field>
          <Field label={t("register.category")} error={err(fe.category)}>
            <Select name="category" defaultValue={v.category} options={CATEGORIES.map((c) => ({ value: c.id, label: loc(c.name, locale) }))} />
          </Field>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("register.venueName")} error={err(fe.business)}>
              <Input name="business" autoComplete="organization" defaultValue={v.business} invalid={!!fe.business} />
            </Field>
            <Field label={t("register.venueType")} error={err(fe.venueType)}>
              <Select name="venueType" defaultValue={v.venueType} options={Object.entries(VENUE_TYPES).map(([value, l]) => ({ value, label: loc(l, locale) }))} />
            </Field>
          </div>
          <Field label={t("register.contactName")} error={err(fe.name)}>
            <Input name="name" autoComplete="name" defaultValue={v.name} invalid={!!fe.name} />
          </Field>
        </>
      )}

      <Field label={t("register.email")} error={err(fe.email)}>
        <Input name="email" type="email" autoComplete="email" defaultValue={v.email} invalid={!!fe.email} />
      </Field>
      <Field label={t("register.password")} hint={t("register.passwordHint")} error={err(fe.password)}>
        <Input name="password" type="password" autoComplete="new-password" invalid={!!fe.password} />
      </Field>

      {state.formError && <Alert tone="bad">{err(state.formError)}</Alert>}
      <Button type="submit" size="lg" className="w-full" disabled={pending}>
        {pending ? t("pending") : role === "artist" ? t("register.submitArtist") : role === "client" ? t("register.submitClient") : t("register.submitVenue")}
      </Button>
      <p className="pt-3 text-center text-sm text-muted">
        {t("register.haveAccount")} <Link href="/login" className="font-medium text-ink underline underline-offset-2">{t("register.loginLink")}</Link>
      </p>
    </form>
  );
}
