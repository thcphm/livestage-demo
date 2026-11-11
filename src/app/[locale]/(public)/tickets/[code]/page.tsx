import { notFound } from "next/navigation";
import QRCode from "qrcode";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CITIES, PAY_METHODS, loc, type Locale } from "@/lib/catalog";
import { formatStamp } from "@/lib/dates";
import { currencyOf, formatMoney } from "@/lib/money";
import { getTicket } from "@/demo/queries";
import { DEMO_TODAY } from "@/demo/store";
import { refundTicket } from "@/demo/actions";
import { Badge } from "@/components/ui/badge";
import { buttonClass } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { ShowDate } from "@/components/show/show-card";

export default async function TicketPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const found = getTicket(code);
  if (!found?.show) notFound();
  const { ticket, show, refund } = found;
  const t = await getTranslations("ticket");
  const to = await getTranslations("ops.ticket");
  const locale = (await getLocale()) as Locale;
  const money = (n: number) => formatMoney(n, currencyOf(show.region), locale);
  // Demo QR holds the code only; the real one carries a signed token so it can't be forged.
  const qr = await QRCode.toString(ticket.code, { type: "svg", margin: 1, width: 220, color: { dark: "#1c1917", light: "#ffffff" } });
  const extra = (ticket.serviceFee ?? 0) + (ticket.surcharge ?? 0);
  const canRefund = !refund && !!show.substitution && !ticket.checkedIn && show.date > DEMO_TODAY;

  return (
    <div className="wrap py-10 max-w-md">
      <h1 className="h-sec">{t("title")}</h1>
      <div className="mt-5 rounded-lg border border-line bg-surface overflow-hidden">
        <div className="flex items-center gap-4 p-5 border-b border-dashed border-line">
          <div className="shrink-0 rounded-md bg-gold px-3 py-2"><ShowDate date={show.date} start={show.start} locale={locale} size="sm" /></div>
          <div className="min-w-0">
            <Link href={`/shows/${show.id}`} className="display block text-[18px] hover:underline decoration-accent decoration-2 underline-offset-4">{show.title}</Link>
            <div className="text-[14px] text-muted">{show.venue.name}, {show.address}, {loc(CITIES[show.city].name, locale)}</div>
          </div>
        </div>

        {refund ? (
          <div className="p-5">
            <Badge tone="bad">{to("refunded", { date: formatStamp(refund.at, locale) })}</Badge>
            <p className="mt-3 text-[15px]">{to(refund.reason === "cancelled" ? "refundCancelled" : "refundLineup")}</p>
            <p className="mt-1 text-[14px] text-muted">{to("refundAmount", { amount: money(ticket.total + extra), method: loc(PAY_METHODS[ticket.method].name, locale) })}</p>
          </div>
        ) : (
          <div className="p-5 flex flex-col items-center gap-3">
            <div className="rounded-lg bg-white p-2" dangerouslySetInnerHTML={{ __html: qr }} />
            <div className="font-mono text-lg tracking-wider">{ticket.code}</div>
            <div className="text-[14.5px] text-muted">{ticket.name}, {t("qty", { count: ticket.qty })}, {to(ticket.kind === "combo" ? "combo" : "showOnly")}</div>
            {ticket.checkedIn
              ? <Badge tone="ok">{t("checkedIn")}</Badge>
              : ticket.method === "cash"
                ? <p className="text-sm text-warn text-center">{t("reserved")}</p>
                : <p className="text-[14.5px] text-muted">{t("paid", { amount: money(ticket.total + extra) })}</p>}
            {extra > 0 && <p className="text-[13px] text-muted text-center">{to("paidLines", { tickets: money(ticket.total), fees: money(extra) })}</p>}
            <p className="text-[14.5px] text-center">{t("checkIn")}</p>
          </div>
        )}

        {canRefund && show.artist && show.substitution && (
          <form action={refundTicket} className="border-t border-line bg-gold p-5">
            <input type="hidden" name="code" value={ticket.code} />
            <div className="font-semibold">{to("lineup")}</div>
            <p className="mt-1 text-[14.5px]">{to("lineupText", { to: show.artist.name, from: show.substitution.from })} {to("refundNote")}</p>
            <SubmitButton className={buttonClass("ghost", "sm", "mt-3")}>{to("refundBtn")}</SubmitButton>
          </form>
        )}
      </div>
    </div>
  );
}
