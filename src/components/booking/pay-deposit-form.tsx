"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { Currency, Locale } from "@/lib/catalog";
import { formatMoney } from "@/lib/money";
import { checkout, formatBps } from "@/server/domain/fees";
import { payDeposit, payOrder } from "@/demo/actions";
import { Field, Select } from "@/components/ui/form";
import { SubmitButton } from "@/components/ui/submit-button";
import { buttonClass } from "@/components/ui/button";

/** Deposit through Olive: the client picks how to pay and sees the service fee and card surcharge first. */
export function PayDepositForm({ bookingId, orderId, deposit, currency, methods, rates }: {
  bookingId?: string;
  /** Set to pay the deposits of every ready artist in a group order at once. */
  orderId?: string;
  deposit: number;
  currency: Currency;
  methods: { value: string; label: string }[];
  rates: { customerBps: number; cardBps: number };
}) {
  const t = useTranslations("ops.pay");
  const locale = useLocale() as Locale;
  const [method, setMethod] = useState(methods[0]?.value ?? "card");
  const money = (n: number) => formatMoney(n, currency, locale);
  const bill = checkout(deposit, rates, method);
  return (
    <form action={orderId ? payOrder : payDeposit} className="mt-4 max-w-md space-y-4">
      {orderId ? <input type="hidden" name="order" value={orderId} /> : <input type="hidden" name="booking" value={bookingId} />}
      <Field label={t("method")} hint={t("cardNote", { pct: formatBps(rates.cardBps) })}>
        <Select name="method" value={method} onChange={(e) => setMethod(e.target.value)} options={methods} />
      </Field>
      <dl className="space-y-1.5 text-[14.5px]">
        <div className="flex justify-between"><dt className="text-muted">{t("deposit")}</dt><dd className="tnum">{money(bill.subtotal)}</dd></div>
        <div className="flex justify-between"><dt className="text-muted">{t("serviceFee", { pct: formatBps(rates.customerBps) })}</dt><dd className="tnum">{money(bill.serviceFee)}</dd></div>
        {bill.surcharge > 0 && <div className="flex justify-between"><dt className="text-muted">{t("surcharge", { pct: formatBps(rates.cardBps) })}</dt><dd className="tnum">{money(bill.surcharge)}</dd></div>}
        <div className="flex items-baseline justify-between border-t border-line pt-2"><dt className="font-semibold">{t("total")}</dt><dd className="display text-[22px] tnum">{money(bill.total)}</dd></div>
      </dl>
      <SubmitButton className={buttonClass("primary", "lg", "w-full")}>{t("button", { amount: money(bill.total) })}</SubmitButton>
      <p className="text-[13px] text-muted">{t("demo")}</p>
    </form>
  );
}
