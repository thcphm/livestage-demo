"use client";

import { useActionState, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Currency, Locale } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { checkout, formatBps } from "@/server/domain/fees";
import { buyTickets, type ActionState } from "@/demo/actions";
import { Field, Input, Select } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const idle: ActionState = { status: "idle" };

/**
 * Ticket purchase without an account. The buyer picks show-only or dinner + show, and sees the
 * service fee and the credit-card surcharge before paying; the server works the same sum out again.
 */
export function BuyTicketsForm({ showId, price, combo, currency, max, methods, rates }: {
  showId: string;
  price: number;
  combo: { price: number; includes: string } | null;
  currency: Currency;
  max: number;
  methods: { value: string; label: string }[];
  rates: { customerBps: number; cardBps: number };
}) {
  const t = useTranslations("shows");
  const to = useTranslations("ops.ticket");
  const locale = useLocale() as Locale;
  const [state, action, pending] = useActionState(buyTickets, idle);
  const [qty, setQty] = useState(Number(state.values?.qty) || 2);
  const [kind, setKind] = useState(state.values?.kind === "combo" && combo ? "combo" : "show");
  const [method, setMethod] = useState(state.values?.method ?? methods[0]?.value ?? "card");
  const err = (k: string) => {
    const e = state.errors?.[k];
    return e ? t(`errors.${e}`, { max }) : undefined;
  };
  const money = (n: number) => formatMoney(n, currency, locale);
  const bill = checkout((kind === "combo" && combo ? combo.price : price) * qty, rates, method);
  const option = (value: string, title: string, amount: number, note?: string) => (
    <label className={`flex cursor-pointer items-start gap-3 rounded-lg border-[1.5px] p-3 ${kind === value ? "border-ink bg-surface2" : "border-line"}`}>
      <input type="radio" name="kind" value={value} checked={kind === value} onChange={() => setKind(value)} className="mt-1 h-4 w-4 accent-[var(--ink)]" />
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="font-semibold">{title}</span>
          <span className="display text-[18px] tnum">{money(amount)}</span>
        </span>
        {note && <span className="block text-[13.5px] text-muted">{note}</span>}
      </span>
    </label>
  );

  return (
    <form action={action} className="mt-5 space-y-4" noValidate>
      <input type="hidden" name="show" value={showId} />
      <fieldset className="space-y-2">
        <legend className="sr-only">{t("price")}</legend>
        {option("show", to("showOnly"), price)}
        {combo && option("combo", to("combo"), combo.price, combo.includes)}
      </fieldset>
      <Field label={t("qty")} error={err("qty")}>
        <Select name="qty" value={String(qty)} onChange={(e) => setQty(Number(e.target.value))}
          options={Array.from({ length: max }, (_, i) => ({ value: String(i + 1), label: String(i + 1) }))} />
      </Field>
      <Field label={t("name")} error={err("name")}>
        <Input name="name" autoComplete="name" defaultValue={state.values?.name} invalid={!!state.errors?.name} />
      </Field>
      <Field label={t("email")} error={err("email")}>
        <Input name="email" type="email" autoComplete="email" defaultValue={state.values?.email} invalid={!!state.errors?.email} />
      </Field>
      <Field label={t("method")} hint={to("cardNote", { pct: formatBps(rates.cardBps) })}>
        <Select name="method" value={method} onChange={(e) => setMethod(e.target.value)} options={methods} />
      </Field>
      <dl className="space-y-1.5 border-t border-line pt-3 text-[14.5px]">
        <div className="flex justify-between"><dt className="text-muted">{to("subtotal")}</dt><dd className="tnum">{money(bill.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{to("serviceFee", { pct: formatBps(rates.customerBps) })}</dt><dd className="tnum">{money(bill.serviceFee)}</dd></div>
        {bill.surcharge > 0 && (
          <div className="flex justify-between"><dt className="text-muted">{to("surcharge", { pct: formatBps(rates.cardBps) })}</dt><dd className="tnum">{money(bill.surcharge)}</dd></div>
        )}
        <div className="flex items-baseline justify-between border-t border-line pt-2">
          <dt className="font-semibold">{to("total")}</dt>
          <dd className="display text-[22px] tnum">{money(bill.total)}</dd>
        </div>
      </dl>
      <Button type="submit" size="lg" className="w-full" disabled={pending}>{t("pay")}</Button>
      <p className="text-[13px] text-muted">{t("noAccount")}</p>
    </form>
  );
}
