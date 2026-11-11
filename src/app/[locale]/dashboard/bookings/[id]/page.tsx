import type { ReactNode } from "react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { CANCEL_POLICIES, CITIES, EVENT_TYPES, PAY_METHODS, REGIONS, loc, type Locale } from "@/lib/catalog";
import { formatDate, formatStamp } from "@/lib/dates";
import { currencyOf, depositAmount, formatMoney } from "@/lib/money";
import { getSessionUser } from "@/server/auth/session";
import { contractState, totalWithExtras } from "@/server/domain/contract";
import { formatBps } from "@/server/domain/fees";
import { bookingView, getRates, type Party } from "@/demo/queries";
import {
  acceptContractAction, acceptQuote, acceptSlot, declineRequest, respondSongRequest, sendMessage, sendQuote, toggleFlag,
} from "@/demo/actions";
import { Badge, StatusBadge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Icon } from "@/components/ui/icon";
import { inputCls } from "@/components/ui/form";
import { buttonClass } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";
import { PayDepositForm } from "@/components/booking/pay-deposit-form";

function Card({ title, id, aside, children }: { title: ReactNode; id?: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28 rounded-lg border border-line bg-surface">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <h2 className="display text-[17px]">{title}</h2>
        {aside}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}

function Row({ k, children }: { k: ReactNode; children: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 text-[14.5px]">
      <dt className="shrink-0 text-muted">{k}</dt>
      <dd className="text-right">{children}</dd>
    </div>
  );
}

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = (await getSessionUser())!;
  const t = await getTranslations("booking");
  const tq = await getTranslations("quote");
  const to = await getTranslations("ops");
  const rates = getRates();
  const locale = (await getLocale()) as Locale;
  const v = bookingView(user, id);
  if (!v) {
    return <div className="wrap py-16 text-center text-muted">{t("notFound")}</div>;
  }
  const { booking: b, artist, buyer } = v;
  const cur = currencyOf(b.region);
  const money = (n: number) => formatMoney(n, cur, locale);
  const city = loc(CITIES[b.city].name, locale);
  const isArtist = v.viewerSide === "artist";
  const isBuyer = v.viewerSide === "buyer";
  const isAdmin = v.viewerSide === "admin";
  const songTitle = (sid: string) => artist?.repertoire.find((s) => s.id === sid);
  const state = contractState(b.contract);
  const open = !["confirmed", "completed", "cancelled", "declined", "rejected", "closed"].includes(b.status);
  const total = b.contract ? totalWithExtras(b.contract.terms) : null;
  const myAcceptance = b.contract ? (isArtist ? b.contract.artistAcceptedAt : isBuyer ? b.contract.buyerAcceptedAt : "admin") : null;

  const party = (label: string, p: Party) => (
    <div className="flex gap-3">
      <Avatar name={p.name} src={p.photo} hue={p.hue} size={40} square={p.kindLabel === "venue"} />
      <div className="min-w-0 text-sm">
        <div className="text-[13px] text-muted">{p.kindLabel === "artist" ? label : `${label}, ${t(`buyerKinds.${p.kindLabel}`)}`}</div>
        <div className="font-medium truncate">{p.name}</div>
        {p.phone ? (
          <div className="text-muted">{p.phone}<br />{p.email}</div>
        ) : (
          <div className="flex items-center gap-1 text-muted"><Icon name="lock" size={13} />{t("contactsLocked")}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="wrap py-6 sm:py-8">
      <Link href="/dashboard" className="link-mark text-[14.5px]">{t("back")}</Link>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="h-page">{b.title}</h1>
        {v.order && <Badge tone="gold">{to("order.tag")}</Badge>}
        <StatusBadge status={b.status} />
        {b.flagged && <Badge tone="bad">{t("flagged")}</Badge>}
      </div>
      <p className="mt-1 text-muted">
        {loc(EVENT_TYPES[b.eventType], locale)}. {formatDate(b.date, locale)}, {b.start}, {b.duration}h. {city}
      </p>
      <p className="mt-1 text-xs text-muted">{b.isPublic ? t("publicLabel") : t("privateLabel")}</p>

      <div className="mt-6 grid lg:grid-cols-[minmax(0,1fr)_320px] gap-6">
        <div className="min-w-0 space-y-5">
          <Card title={t("details")}>
            <dl>
              <Row k={t("when")}>{formatDate(b.date, locale)}, {b.start}</Row>
              <Row k={t("where")}>{b.address ?? <span className="inline-flex items-center gap-1 text-muted"><Icon name="lock" size={13} />{t("addressHidden")}. {city}</span>}</Row>
              <Row k={tq("guests")}>{b.guests}</Row>
            </dl>
            {b.notes && <p className="mt-3 rounded-lg bg-surface2 px-3 py-2 text-sm">{b.notes}</p>}
          </Card>

          {b.status === "open" && isArtist && (
            <Card title={t("acceptSlot")}>
              <div className="flex items-center justify-between gap-4">
                <div className="text-sm">{t("slotFee")}: <span className="font-medium tnum">{money(b.fee)}</span></div>
                <form action={acceptSlot}><input type="hidden" name="booking" value={b.id} /><SubmitButton className={buttonClass("primary", "md")}>{t("acceptSlot")}</SubmitButton></form>
              </div>
            </Card>
          )}

          {b.source !== "slot" && (
            <Card title={t("quote")}>
              {b.quote ? (
                <dl>
                  <Row k={t("price")}><span className="tnum">{money(b.quote.price)}</span></Row>
                  {b.quote.travel > 0 && <Row k={t("travel")}><span className="tnum">{money(b.quote.travel)}</span></Row>}
                  {b.quote.overtime > 0 && <Row k={t("overtime")}><span className="tnum">{money(b.quote.overtime)}/h</span></Row>}
                  <Row k={t("duration")}>{loc(b.quote.dur, locale)}</Row>
                  <Row k={t("deposit", { pct: b.quote.depositPct })}><span className="tnum">{money(depositAmount(total ?? b.quote.price + b.quote.travel, b.quote.depositPct))}</span></Row>
                  <Row k={t("cancel")}><span className="text-muted">{loc(CANCEL_POLICIES[b.quote.cancel], locale)}</span></Row>
                  {b.quote.equip && <Row k={t("prepare")}>{b.quote.equip}</Row>}
                  {b.quote.terms && <Row k={t("terms")}>{b.quote.terms}</Row>}
                </dl>
              ) : <p className="text-sm text-muted">{t("noQuote")}</p>}

              {isArtist && (b.status === "new" || b.status === "quoted") && (
                <form action={sendQuote} className="mt-4 grid sm:grid-cols-4 gap-2 border-t border-line pt-4">
                  <input type="hidden" name="booking" value={b.id} />
                  <input name="price" type="number" min={1} required placeholder={`${t("price")} (${cur})`} aria-label={t("price")} defaultValue={b.quote ? (cur === "CAD" ? b.quote.price / 100 : b.quote.price) : ""} className={inputCls} />
                  <select name="deposit" defaultValue={String(b.quote?.depositPct ?? 30)} aria-label={t("deposit", { pct: "" })} className={inputCls}>
                    {[0, 20, 30, 50].map((n) => <option key={n} value={n}>{t("deposit", { pct: n })}</option>)}
                  </select>
                  <select name="cancel" defaultValue={String(b.quote?.cancel ?? 1)} aria-label={t("cancel")} className={inputCls}>
                    {CANCEL_POLICIES.map((p, i) => <option key={i} value={i}>{loc(p, locale).split(":")[0]}</option>)}
                  </select>
                  <SubmitButton className={buttonClass("primary", "md")}>{t("sendQuote")}</SubmitButton>
                  <input name="terms" placeholder={t("terms")} aria-label={t("terms")} defaultValue={b.quote?.terms} className={`${inputCls} sm:col-span-3`} />
                  {b.status === "new" && (
                    <SubmitButton formAction={declineRequest} className={buttonClass("danger", "md")}>{t("decline")}</SubmitButton>
                  )}
                </form>
              )}
              {isBuyer && b.status === "quoted" && (
                <form action={acceptQuote} className="mt-4 border-t border-line pt-4">
                  <input type="hidden" name="booking" value={b.id} />
                  <SubmitButton className={buttonClass("primary", "md")}>{t("acceptQuote")}</SubmitButton>
                </form>
              )}
            </Card>
          )}

          {artist && b.source !== "slot" && (
            <Card title={t("setlist")}>
              {b.setlist.length ? (
                <ol className="space-y-1 text-sm">
                  {b.setlist.map((sid, i) => {
                    const s = songTitle(sid);
                    return s ? <li key={sid} className="flex gap-3"><span className="w-5 text-muted tnum">{i + 1}</span><span>{s.title} <span className="text-muted">{s.original}</span></span></li> : null;
                  })}
                </ol>
              ) : <p className="text-sm text-muted">{t("setlistEmpty")}</p>}

              {b.songRequests.length > 0 && (
                <div className="mt-5">
                  <div className="text-sm font-medium mb-2">{t("requests")}</div>
                  <ul className="divide-y divide-line border-y border-line">
                    {b.songRequests.map((r) => (
                      <li key={r.id} className="py-2.5 text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{r.title}</span>
                          <span className="text-muted">{r.originalArtist}</span>
                          <Badge tone={r.status === "accepted" ? "ok" : r.status === "declined" ? "bad" : "warn"}>{t(`req.${r.status}`)}</Badge>
                          {r.status === "accepted" && <span className="text-muted">{r.extraFee ? `${t("extraFee")}: ${money(r.extraFee)}` : t("free")}</span>}
                        </div>
                        {r.note && <div className="text-muted mt-0.5">{r.note}</div>}
                        {isArtist && r.status === "pending" && open && (
                          <form action={respondSongRequest} className="mt-2 flex flex-wrap gap-2">
                            <input type="hidden" name="booking" value={b.id} />
                            <input type="hidden" name="request" value={r.id} />
                            <input name="fee" type="number" min={0} placeholder={`${t("extraFee")} (${cur})`} aria-label={t("extraFee")} className={`${inputCls} w-40!`} />
                            <SubmitButton name="decision" value="accept" className={buttonClass("primary", "sm")}>{t("acceptSong")}</SubmitButton>
                            <SubmitButton name="decision" value="decline" className={buttonClass("ghost", "sm")}>{t("declineSong")}</SubmitButton>
                          </form>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          )}

          {artist && b.source !== "slot" && (
            <Card title={t("contract")} aside={b.contract && <span className="text-sm text-muted">{t("contractVersion", { v: b.contract.version })}</span>}>
              {b.contract ? (
                <>
                  <Badge tone={state === "signed" ? "ok" : "warn"}>{t(`contractStates.${state}`)}</Badge>
                  <dl className="mt-3">
                    <Row k={t("price")}><span className="tnum">{money(b.contract.terms.price)}</span></Row>
                    {b.contract.terms.extraSongs.map((x) => (
                      <Row key={x.title} k={`+ ${x.title}`}><span className="tnum">{x.extraFee ? money(x.extraFee) : t("free")}</span></Row>
                    ))}
                    <Row k={t("contractTotal")}><span className="font-medium tnum">{money(total!)}</span></Row>
                    <Row k={t("deposit", { pct: b.contract.terms.depositPct })}><span className="tnum">{money(depositAmount(total!, b.contract.terms.depositPct))}</span></Row>
                    <Row k={t("setlist")}>{b.contract.terms.setlist.length}</Row>
                    <Row k={t("cancel")}><span className="text-muted">{loc(CANCEL_POLICIES[b.contract.terms.cancelPolicy], locale)}</span></Row>
                    <Row k={t("licence")}>{t(`licenceHolders.${b.contract.terms.licenceHolder}`)}</Row>
                    <Row k={t("buyer")}>{b.contract.buyerAcceptedAt ? t("accepted", { date: formatStamp(b.contract.buyerAcceptedAt, locale) }) : <span className="text-muted">{t("notAccepted")}</span>}</Row>
                    <Row k={t("artist")}>{b.contract.artistAcceptedAt ? t("accepted", { date: formatStamp(b.contract.artistAcceptedAt, locale) }) : <span className="text-muted">{t("notAccepted")}</span>}</Row>
                  </dl>
                  {!myAcceptance && open && (isArtist || (isBuyer && b.status !== "quoted")) && (
                    <form action={acceptContractAction} className="mt-3">
                      <input type="hidden" name="booking" value={b.id} />
                      <SubmitButton className={buttonClass("primary", "md")}>{t("acceptContract")}</SubmitButton>
                    </form>
                  )}
                  <p className="mt-3 text-xs text-muted">{t("contractNote")}</p>
                </>
              ) : <p className="text-sm text-muted">{t("contractStates.none")}</p>}
            </Card>
          )}

          {isBuyer && b.contract && b.status === "pending_payment" && !b.payment && (
            <Card title={t("pay")}>
              <p className="text-sm text-muted">{t("payNote")}</p>
              {b.contract.artistAcceptedAt ? (
                <PayDepositForm
                  bookingId={b.id}
                  deposit={depositAmount(total!, b.contract.terms.depositPct)}
                  currency={cur}
                  methods={REGIONS[b.region].payMethods.filter((m) => m !== "cash").map((m) => ({ value: m, label: loc(PAY_METHODS[m].name, locale) }))}
                  rates={{ customerBps: rates.customerBps, cardBps: rates.cardBps }}
                />
              ) : <p className="mt-3 text-sm">{t("payNeedsContract")}</p>}
            </Card>
          )}

          <Card id="messages" title={t("messages")}>
            {v.messages.length ? (
              <ul className="space-y-3">
                {v.messages.map((m) => {
                  const mine = (m.from === "artist" && isArtist) || (m.from === "buyer" && isBuyer) || (m.from === "admin" && isAdmin);
                  const who = m.from === "admin" ? t("from.admin") : m.from === "artist" ? artist?.name : buyer.name;
                  return (
                    <li key={m.id} className={`flex ${mine ? "justify-end" : ""}`}>
                      <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${mine ? "bg-ink text-bg" : m.from === "admin" ? "bg-gold" : "bg-surface2"}`}>
                        <div className={`text-xs mb-0.5 ${mine ? "opacity-70" : "text-muted"}`}>{who}, {formatStamp(m.at, locale)}</div>
                        <div className="whitespace-pre-wrap">{m.text}</div>
                        {m.masked && <div className={`mt-1 flex items-center gap-1 text-xs ${mine ? "opacity-70" : "text-muted"}`}><Icon name="lock" size={12} />{t("masked")}</div>}
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="text-sm text-muted">{t("messagesEmpty")}</p>}
            {!v.contactsRevealed && !isAdmin && <p className="mt-4 text-xs text-muted">{t("maskedNote")}</p>}
            {(isArtist ? !!artist : true) && b.status !== "open" && (
              <form action={sendMessage} className="mt-3 flex gap-2">
                <input type="hidden" name="booking" value={b.id} />
                <input name="text" required placeholder={t("placeholder")} aria-label={t("placeholder")} className={inputCls} />
                <SubmitButton className={buttonClass("primary", "md")}><Icon name="send" size={16} />{t("send")}</SubmitButton>
              </form>
            )}
          </Card>

          {b.history.length > 0 && (
            <Card title={t("history")}>
              <ol className="space-y-1.5 text-sm">
                {b.history.map((h, i) => (
                  <li key={i} className="flex gap-3"><span className="w-28 shrink-0 text-muted tnum">{formatStamp(h.at, locale)}</span><span>{loc(h.text, locale)}</span></li>
                ))}
              </ol>
            </Card>
          )}
        </div>

        <aside className="space-y-5 self-start lg:sticky lg:top-24">
          {v.order && (
            <section className="rounded-lg border border-ink/25 bg-surface p-4">
              <div className="display text-[17px]">{to("order.title")}</div>
              <div className="text-[14px] text-muted">{to("order.count", { count: v.order.items.length })}</div>
              <ul className="mt-3 divide-y divide-line border-y border-line text-[14.5px]">
                {v.order.items.map((i) => (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2">
                    {i.current || isArtist ? <span className={i.current ? "font-semibold" : ""}>{isArtist && !i.current ? to("order.other") : i.artist}</span>
                      : <Link href={`/dashboard/bookings/${i.id}`} className="link-mark">{i.artist}</Link>}
                    <span className="flex items-center gap-2">
                      {!isArtist || i.current ? <span className="tnum text-muted">{i.price !== null ? money(i.price) : to("order.pending")}</span> : null}
                      <StatusBadge status={i.status} />
                    </span>
                  </li>
                ))}
              </ul>
              {isBuyer && v.order.payable.count > 1 && (
                <div className="mt-3 border-t border-line pt-3">
                  <div className="font-semibold">{to("order.payAll")}</div>
                  <p className="text-[14px] text-muted">{to("order.payAllHint", { count: v.order.payable.count })}</p>
                  <PayDepositForm
                    orderId={v.order.id}
                    deposit={v.order.payable.deposit}
                    currency={cur}
                    methods={REGIONS[b.region].payMethods.filter((m) => m !== "cash").map((m) => ({ value: m, label: loc(PAY_METHODS[m].name, locale) }))}
                    rates={{ customerBps: rates.customerBps, cardBps: rates.cardBps }}
                  />
                </div>
              )}
              {!isArtist && <div className="mt-3 flex items-baseline justify-between"><span className="text-[14px] text-muted">{to("order.total")}</span><span className="display text-[19px] tnum">{money(v.order.total)}</span></div>}
            </section>
          )}

          <section className="rounded-lg border border-line bg-surface p-4 space-y-4">
            {party(t("buyer"), buyer)}
            {artist ? party(t("artist"), artist.contact) : <p className="text-sm text-muted">{t("noArtist")}</p>}
            {artist && <Link href={`/artists/${artist.slug}`} className="link-mark inline-block text-[14.5px]">{artist.name}</Link>}
          </section>

          {b.payment && (
            <section className="rounded-lg border border-line bg-surface p-4 text-sm">
              <div className="flex items-center gap-2 font-medium"><Icon name="check" size={16} className="text-ok" />{t("paid", { amount: money(b.payment.deposit), date: formatStamp(b.payment.paidAt, locale) })}</div>
              <div className="text-muted mt-0.5">{t("via", { provider: b.payment.provider === "stripe" ? "Stripe, Olive" : "Olive" })}. {loc(PAY_METHODS[b.payment.method].name, locale)}</div>
              {(b.payment.serviceFee ?? 0) + (b.payment.surcharge ?? 0) > 0 && (
                <dl className="mt-2 border-t border-line pt-2">
                  <Row k={to("pay.serviceFee", { pct: formatBps(rates.customerBps) })}><span className="tnum">{money(b.payment.serviceFee ?? 0)}</span></Row>
                  {(b.payment.surcharge ?? 0) > 0 && <Row k={to("pay.surcharge", { pct: formatBps(rates.cardBps) })}><span className="tnum">{money(b.payment.surcharge!)}</span></Row>}
                </dl>
              )}
            </section>
          )}

          {b.ticketing && (
            <section className="rounded-lg border border-line bg-surface p-4 text-sm">
              <div className="font-medium">{t("tickets")}</div>
              <div className="text-muted">{t("ticketsSold", { sold: v.ticketsSold, capacity: b.ticketing.capacity })}</div>
              <Link href={`/shows/${b.id}`} className="link-mark">{t("viewShow")}</Link>
            </section>
          )}

          {isAdmin && (
            <section className="rounded-lg border border-line bg-surface p-4 text-sm space-y-3">
              {v.feeSplit && (
                <div>
                  <div className="flex items-center justify-between"><span className="font-medium">{t("fee")}</span><Badge>{t("feeOnly")}</Badge></div>
                  <dl className="mt-2">
                    <Row k={t("feeGross")}><span className="tnum">{money(v.feeSplit.gross)}</span></Row>
                    <Row k={t("feeOlive", { pct: formatBps(v.feeSplit.bps) })}><span className="tnum">{money(v.feeSplit.fee)}</span></Row>
                    <Row k={t("feePayout")}><span className="font-medium tnum">{money(v.feeSplit.payout)}</span></Row>
                    {v.platform && <Row k={to("admin.customerFee", { pct: formatBps(v.platform.customerBps) })}><span className="tnum">{money(v.platform.customerFee)}</span></Row>}
                  </dl>
                </div>
              )}
              {v.platform && v.platform.ticketRevenue > 0 && (
                <dl className="border-t border-line pt-2">
                  <Row k={to("venue.revenue")}><span className="tnum">{money(v.platform.ticketRevenue)}</span></Row>
                  <Row k={to("admin.ticketCommission")}><span className="tnum">{money(v.platform.ticketCommission)}</span></Row>
                </dl>
              )}
              <form action={toggleFlag}>
                <input type="hidden" name="booking" value={b.id} />
                <SubmitButton className={buttonClass("ghost", "sm")}>{b.flagged ? t("unflag") : t("flag")}</SubmitButton>
              </form>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
