import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog";
import { formatDate } from "@/lib/dates";
import { findTickets } from "@/demo/queries";
import { inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";

export default async function TicketLookupPage({ searchParams }: { searchParams: Promise<{ email?: string }> }) {
  const t = await getTranslations("ticket");
  const locale = (await getLocale()) as Locale;
  const { email } = await searchParams;
  const found = email ? findTickets(email) : [];

  return (
    <div className="wrap py-10 max-w-lg">
      <h1 className="h-sec">{t("lookupTitle")}</h1>
      <p className="text-muted mt-1">{t("lookupSub")}</p>
      <form action={`/${locale}/tickets`} method="get" className="mt-5 flex gap-2">
        <input name="email" type="email" required defaultValue={email} placeholder="an.nguyen@gmail.com" className={inputCls} />
        <button type="submit" className={buttonClass("primary", "md")}>{t("lookup")}</button>
      </form>
      <p className="mt-2 text-xs text-muted">{t("demoNote")}</p>
      {email && (
        found.length ? (
          <ul className="mt-6 divide-y divide-line rounded-xl border border-line bg-surface">
            {found.map(({ ticket, show }) => (
              <li key={ticket.id} className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="min-w-0">
                  <div className="font-medium truncate">{show?.title}</div>
                  <div className="text-sm text-muted">{show && formatDate(show.date, locale)}, {t("qty", { count: ticket.qty })}</div>
                </div>
                <Link href={`/tickets/${ticket.code}`} className={buttonClass("ghost", "sm")}>{t("open")}</Link>
              </li>
            ))}
          </ul>
        ) : <p className="mt-6 text-muted">{t("none")}</p>
      )}
    </div>
  );
}
