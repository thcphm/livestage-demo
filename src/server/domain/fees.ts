/**
 * Olive's platform fee, set privately per artist (R4). Money is collected by Olive (Stripe),
 * which keeps the fee and pays the rest out. Amounts are integer minor units.
 */

export interface PlatformFee {
  /** Basis points: 1500 = 15%. */
  bps: number;
  /** Minimum fee per booking in minor units (0 = none). */
  minimum: number;
}

export interface FeeSplit {
  gross: number;
  fee: number;
  payout: number;
}

export function splitPayment(gross: number, fee: PlatformFee): FeeSplit {
  if (!Number.isInteger(gross) || gross < 0) throw new Error("gross must be a non-negative integer (minor units)");
  // Round half up to the nearest minor unit; never take more than the whole amount.
  const pct = Math.round((gross * fee.bps) / 10_000);
  const feeAmount = Math.min(gross, Math.max(pct, fee.minimum));
  return { gross, fee: feeAmount, payout: gross - feeAmount };
}

export const formatBps = (bps: number): string => `${(bps / 100).toLocaleString("en", { maximumFractionDigits: 2 })}%`;

/**
 * Platform-wide rates set by an Olive super admin (meeting 2026-11-07): what Olive takes from the
 * venue, the customer and combo tickets, plus the surcharge for paying by credit card.
 * The artist's own rate stays per artist (`PlatformFee`); `artistBps` is the default for new artists.
 */
export interface PlatformRates {
  artistBps: number;
  /** Commission on a venue's ticket revenue. */
  venueBps: number;
  /** Service fee added to what the customer pays (tickets and deposits). */
  customerBps: number;
  /** Surcharge added when the customer pays by credit card. */
  cardBps: number;
  /** Commission on dinner + show combo tickets (replaces `venueBps` for those). */
  comboBps: number;
}

export const DEFAULT_RATES: PlatformRates = { artistBps: 1500, venueBps: 500, customerBps: 300, cardBps: 290, comboBps: 1000 };

export interface Checkout {
  subtotal: number;
  serviceFee: number;
  surcharge: number;
  total: number;
}

const share = (amount: number, bps: number) => Math.round((amount * bps) / 10_000);

/** What the customer is charged: subtotal + Olive's service fee + a card surcharge when paying by card. */
export function checkout(subtotal: number, rates: Pick<PlatformRates, "customerBps" | "cardBps">, method: string): Checkout {
  if (!Number.isInteger(subtotal) || subtotal < 0) throw new Error("subtotal must be a non-negative integer (minor units)");
  const serviceFee = share(subtotal, rates.customerBps);
  const surcharge = method === "card" ? share(subtotal + serviceFee, rates.cardBps) : 0;
  return { subtotal, serviceFee, surcharge, total: subtotal + serviceFee + surcharge };
}

/** Olive's commission on ticket revenue: the combo rate for dinner + show tickets, the venue rate otherwise. */
export function ticketCommission(revenue: number, kind: "show" | "combo", rates: Pick<PlatformRates, "venueBps" | "comboBps">): number {
  return Math.min(revenue, share(revenue, kind === "combo" ? rates.comboBps : rates.venueBps));
}
