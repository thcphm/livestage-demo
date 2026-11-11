"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { submitQuoteRequest, type ActionState } from "@/demo/actions";
import { Alert, Field, Input, Select, inputCls } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const idle: ActionState = { status: "idle" };
type Opt = { value: string; label: string };

export function QuoteForm({ artistSlug, minDate, defaults, options, repertoire, others = [] }: {
  artistSlug?: string;
  minDate: string;
  defaults: { date: string; eventType: string; category: string; city: string };
  options: { eventTypes: Opt[]; categories: Opt[]; cities: Opt[]; budgets: Opt[] };
  repertoire: { id: string; title: string; original: string; signature: boolean }[];
  /** Other artists that can be added to the same event (group order). */
  others?: { id: string; name: string; label: string }[];
}) {
  const t = useTranslations("quote");
  const to = useTranslations("ops.order");
  const [state, action, pending] = useActionState(submitQuoteRequest, idle);
  const v = state.values ?? {};
  const err = (k: string) => (state.errors?.[k] ? t(`errors.${state.errors[k]}`) : undefined);
  const h2 = "display text-[18px] mb-3";

  return (
    <form action={action} className="mt-4 space-y-8" noValidate>
      {artistSlug && <input type="hidden" name="artist" value={artistSlug} />}
      {state.errors?.form && <Alert tone="bad">{state.errors.form === "alsoBusy" ? to("alsoBusy", { name: v.busy ?? "" }) : t(`errors.${state.errors.form}`)}</Alert>}

      <section>
        <h2 className={h2}>{t("event")}</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Field label={t("title")} error={err("title")}>
              <Input name="title" defaultValue={v.title} placeholder={t("titlePlaceholder")} invalid={!!state.errors?.title} />
            </Field>
          </div>
          <Field label={t("eventType")}><Select name="eventType" defaultValue={v.eventType ?? defaults.eventType} options={options.eventTypes} /></Field>
          {artistSlug
            ? <input type="hidden" name="category" value={defaults.category} />
            : <Field label={t("category")}><Select name="category" defaultValue={v.category ?? defaults.category} options={options.categories} /></Field>}
          <Field label={t("date")} error={err("date")}>
            <Input name="date" type="date" min={minDate} defaultValue={v.date ?? defaults.date} invalid={!!state.errors?.date} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("start")} error={err("start")}><Input name="start" type="time" defaultValue={v.start ?? "19:00"} /></Field>
            <Field label={t("duration")} error={err("duration")}><Input name="duration" type="number" min={1} max={8} defaultValue={v.duration ?? "3"} /></Field>
          </div>
          <Field label={t("city")} error={err("city")}><Select name="city" defaultValue={v.city ?? defaults.city} options={options.cities} /></Field>
          <Field label={t("address")} hint={t("addressHint")} error={err("address")}>
            <Input name="address" defaultValue={v.address} invalid={!!state.errors?.address} />
          </Field>
          <Field label={t("guests")} error={err("guests")}><Input name="guests" type="number" min={1} defaultValue={v.guests ?? "50"} invalid={!!state.errors?.guests} /></Field>
          <Field label={t("budget")}><Select name="budget" defaultValue={v.budget ?? "1"} options={options.budgets} /></Field>
          <div className="sm:col-span-2">
            <Field label={t("notes")}>
              <textarea name="notes" rows={3} defaultValue={v.notes} className={`${inputCls} h-auto py-2`} />
            </Field>
          </div>
        </div>
      </section>

      {artistSlug && repertoire.length > 0 && (
        <section>
          <h2 className={h2}>{t("music")}</h2>
          <div className="text-[13px] font-medium">{t("setlist")}</div>
          <p className="text-xs text-muted mb-2">{t("setlistHint")}</p>
          <ul className="grid sm:grid-cols-2 gap-x-6 border-t border-line">
            {repertoire.map((s) => (
              <li key={s.id} className="border-b border-line">
                <label className="flex items-center gap-3 py-2 text-sm cursor-pointer">
                  <input type="checkbox" name="setlist" value={s.id} defaultChecked={s.signature} className="h-4 w-4 accent-[var(--ink)]" />
                  <span className="flex-1 min-w-0 truncate">{s.title} <span className="text-muted">{s.original}</span></span>
                </label>
              </li>
            ))}
          </ul>

          <div className="mt-6 text-[13px] font-medium">{t("requests")}</div>
          <p className="text-xs text-muted mb-2">{t("requestsHint")}</p>
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="grid grid-cols-3 gap-2">
                <input name={`req${i}title`} placeholder={t("songTitle")} aria-label={t("songTitle")} className={inputCls} />
                <input name={`req${i}orig`} placeholder={t("songOriginal")} aria-label={t("songOriginal")} className={inputCls} />
                <input name={`req${i}note`} placeholder={t("songNote")} aria-label={t("songNote")} className={inputCls} />
              </div>
            ))}
          </div>
        </section>
      )}

      {artistSlug && others.length > 0 && (
        <section>
          <h2 className={h2}>{to("add")}</h2>
          <p className="mb-3 text-[14.5px] text-muted">{to("addHint")}</p>
          <ul className="grid sm:grid-cols-2 gap-x-6 border-t border-line">
            {others.map((a) => (
              <li key={a.id} className="border-b border-line">
                <label className="flex items-center gap-3 py-2 text-[15px] cursor-pointer">
                  <input type="checkbox" name="also" value={a.id} className="h-4 w-4 accent-[var(--ink)]" />
                  <span className="flex-1 min-w-0 truncate"><span className="font-semibold">{a.name}</span> <span className="text-muted">{a.label}</span></span>
                </label>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Button type="submit" size="lg" disabled={pending}>{t("submit")}</Button>
    </form>
  );
}
