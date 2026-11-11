"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { createReservation, type ActionState } from "@/demo/actions";
import { Field, Input, Select, inputCls } from "@/components/ui/form";
import { Button } from "@/components/ui/button";

const idle: ActionState = { status: "idle" };

/** Table request inside the widget a restaurant embeds on its own site. Picking a show fixes the date. */
export function ReservationForm({ venueId, minDate, shows }: { venueId: string; minDate: string; shows: { value: string; label: string }[] }) {
  const t = useTranslations("ops.embed");
  const [state, action, pending] = useActionState(createReservation, idle);
  const v = state.values ?? {};
  const err = (k: string) => (state.errors?.[k] ? t(`errors.${state.errors[k]}`) : undefined);
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      <input type="hidden" name="venue" value={venueId} />
      <div className="sm:col-span-2">
        <Field label={t("show")}>
          <Select name="show" defaultValue={v.show ?? ""} options={[{ value: "", label: t("noShow") }, ...shows]} />
        </Field>
      </div>
      <Field label={t("date")} hint={t("dateHint")} error={err("date")}><Input name="date" type="date" min={minDate} defaultValue={v.date} invalid={!!state.errors?.date} /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label={t("time")} error={err("time")}><Input name="time" type="time" defaultValue={v.time ?? "19:00"} invalid={!!state.errors?.time} /></Field>
        <Field label={t("party")} error={err("party")}><Input name="party" type="number" min={1} max={20} defaultValue={v.party ?? "2"} invalid={!!state.errors?.party} /></Field>
      </div>
      <Field label={t("name")} error={err("name")}><Input name="name" autoComplete="name" defaultValue={v.name} invalid={!!state.errors?.name} /></Field>
      <Field label={t("phone")} error={err("phone")}><Input name="phone" type="tel" autoComplete="tel" defaultValue={v.phone} invalid={!!state.errors?.phone} /></Field>
      <div className="sm:col-span-2"><Field label={t("email")} error={err("email")}><Input name="email" type="email" autoComplete="email" defaultValue={v.email} invalid={!!state.errors?.email} /></Field></div>
      <div className="sm:col-span-2"><Field label={t("note")}><textarea name="note" rows={2} defaultValue={v.note} className={`${inputCls} h-auto py-2`} /></Field></div>
      <div className="sm:col-span-2"><Button type="submit" size="lg" disabled={pending}>{t("submit")}</Button></div>
    </form>
  );
}
