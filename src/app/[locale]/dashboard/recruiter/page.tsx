import { getLocale, getTranslations } from "next-intl/server";
import { CATEGORIES, CITIES, REGIONS, loc, type Locale } from "@/lib/catalog";
import { formatStamp } from "@/lib/dates";
import { requireRole } from "@/server/auth/session";
import { leadsFor } from "@/demo/queries";
import { addLead, updateLead } from "@/demo/actions";
import type { LeadStatus } from "@/demo/types";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Field, inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { DashShell, pickTab, type DashTab } from "@/components/dashboard/dash-shell";
import { SubmitButton } from "@/components/ui/submit-button";

const STATUSES: LeadStatus[] = ["new", "contacted", "negotiating", "signed", "lost"];
const TONE = { new: "info", contacted: "neutral", negotiating: "warn", signed: "ok", lost: "bad" } as const;

/**
 * Recruitment manager: brings artists and agencies onto the platform. Sees only their own
 * pipeline – no bookings, no money. A signed lead gets an account (one manager account per agency).
 */
export default async function RecruiterDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireRole("recruiter", "/dashboard/recruiter");
  const t = await getTranslations("ops.recruit");
  const locale = (await getLocale()) as Locale;
  const region = user.region!;
  const leads = leadsFor(user.entityId!);
  const open = leads.filter((l) => !["signed", "lost"].includes(l.status));
  const tabs: DashTab[] = [{ key: "pipeline", label: t("pipeline"), count: open.length }, { key: "add", label: t("addTitle") }];
  const active = pickTab(tabs, (await searchParams).tab);
  const stat = (label: string, value: number) => (
    <div className="border-t border-ink/20 pt-2"><div className="text-[13.5px] text-muted">{label}</div><div className="display text-[26px] tnum">{value}</div></div>
  );

  return (
    <DashShell
      title={user.displayName}
      sub={t("sub", { region: loc(REGIONS[region].name, locale) })}
      avatar={<Avatar name={user.displayName} hue={user.hue} size={52} />}
      tabs={tabs}
      active={active.key}
      basePath="/dashboard/recruiter"
    >
      {active.key === "pipeline" && (
        <>
          <div className="grid max-w-2xl grid-cols-3 gap-6">
            {stat(t("totals.open"), open.length)}
            {stat(t("totals.signed"), leads.filter((l) => l.status === "signed").length)}
            {stat(t("totals.artists"), open.reduce((n, l) => n + l.size, 0))}
          </div>
          <p className="max-w-2xl text-muted">{t("signedHint")}</p>
          {STATUSES.map((status) => {
            const group = leads.filter((l) => l.status === status);
            if (!group.length) return null;
            return (
              <section key={status}>
                <h2 className="display text-[18px] mb-3 flex items-center gap-2">{t(`status.${status}`)} <span className="font-sans text-[15px] font-normal tracking-normal text-muted">{group.length}</span></h2>
                <ul className="divide-y divide-line rounded-lg border border-line bg-surface">
                  {group.map((l) => (
                    <li key={l.id} className="grid gap-x-6 gap-y-3 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="display text-[17px]">{l.name}</span>
                          <Badge tone={TONE[l.status]}>{t(`status.${l.status}`)}</Badge>
                        </div>
                        <div className="text-[14.5px] text-muted">
                          {t(`kind.${l.kind}`)}{l.kind === "agency" ? `, ${t("represents", { count: l.size })}` : ""}. {loc(CATEGORIES.find((c) => c.id === l.category)?.name, locale)}, {loc(CITIES[l.city].name, locale)}
                        </div>
                        <div className="text-[14.5px]">{l.contact}</div>
                        {l.notes.length > 0 && (
                          <ol className="mt-2 space-y-1 border-l-[3px] border-gold pl-3 text-[14px]">
                            {l.notes.map((n, i) => <li key={i}><span className="text-muted tnum">{formatStamp(n.at, locale)}</span> {n.text}</li>)}
                          </ol>
                        )}
                      </div>
                      <form action={updateLead} className="flex flex-wrap items-end gap-2 self-start">
                        <input type="hidden" name="lead" value={l.id} />
                        <label className="block">
                          <span className="mb-1.5 block text-[13px] font-medium">{t("statusLabel")}</span>
                          <select name="status" defaultValue={l.status} className={`${inputCls} w-40!`}>
                            {STATUSES.map((s) => <option key={s} value={s}>{t(`status.${s}`)}</option>)}
                          </select>
                        </label>
                        <label className="block min-w-0 flex-1">
                          <span className="mb-1.5 block text-[13px] font-medium">{t("note")}</span>
                          <input name="note" maxLength={400} className={inputCls} />
                        </label>
                        <SubmitButton className={buttonClass("ghost", "md")}>{t("update")}</SubmitButton>
                      </form>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {!leads.length && <p className="text-muted">{t("noLeads")}</p>}
        </>
      )}

      {active.key === "add" && (
        <form action={addLead} className="grid max-w-2xl gap-4 rounded-lg border border-line p-4 sm:grid-cols-2">
          <div className="sm:col-span-2"><Field label={t("name")}><input name="name" required maxLength={120} className={inputCls} /></Field></div>
          <Field label={t("kindLabel")}>
            <select name="kind" className={inputCls}><option value="artist">{t("kind.artist")}</option><option value="agency">{t("kind.agency")}</option></select>
          </Field>
          <Field label={t("size")}><input name="size" type="number" min={1} defaultValue={1} className={inputCls} /></Field>
          <Field label={t("category")}>
            <select name="category" className={inputCls}>{CATEGORIES.map((c) => <option key={c.id} value={c.id}>{loc(c.name, locale)}</option>)}</select>
          </Field>
          <Field label={t("city")}>
            <select name="city" className={inputCls}>{REGIONS[region].cities.map((c) => <option key={c} value={c}>{loc(CITIES[c].name, locale)}</option>)}</select>
          </Field>
          <div className="sm:col-span-2"><Field label={t("contact")}><input name="contact" maxLength={160} className={inputCls} /></Field></div>
          <div className="sm:col-span-2"><SubmitButton className={buttonClass("primary", "md")}>{t("add")}</SubmitButton></div>
        </form>
      )}
    </DashShell>
  );
}
