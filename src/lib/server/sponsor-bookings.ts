import type { PublicBooking, SponsorCreative, SponsorSpot } from "../sponsors.ts";
import { sponsorCents, sponsorTermDays } from "../sponsors.ts";

export const stripeApp = "skillpress-sponsorships";
export const termMs = sponsorTermDays * 86400000;
export interface Booking {
  id: string;
  attempt: string;
  session: string;
  kind: SponsorSpot["kind"];
  status: "held" | "paid";
  until: number;
  creative: SponsorCreative;
}
export type Ledger = Record<string, Booking>;
export interface PaymentSession {
  id: string;
  mode: string | null;
  status: string | null;
  payment_status: string;
  currency: string | null;
  amount_total: number | null;
  metadata: Record<string, string> | null;
}

export function available(row: Booking | undefined, now: number) {
  // Even after the local hold deadline Stripe must confirm that the session expired.
  return !row || (row.status === "paid" && row.until <= now);
}

export function publicBookings(ledger: Ledger, now: number) {
  const bookings: Record<string, PublicBooking> = {};
  for (const [spot, row] of Object.entries(ledger)) {
    if (available(row, now)) continue;
    bookings[spot] = { status: row.status, until: row.until, ...(row.status === "paid" ? { creative: row.creative } : { reference: row.id }) };
  }
  return bookings;
}

/** The return page, webhook and reconciliation all use this same idempotent transition. */
export function applySession(ledger: Ledger, session: PaymentSession, now: number): boolean {
  const meta = session.metadata;
  if (meta?.app !== stripeApp) return false;
  const row = ledger[meta.spot];
  if (!row || row.session !== session.id || row.id !== meta.booking || row.status !== "held") return false;
  if (session.status === "expired") {
    delete ledger[meta.spot];
    return true;
  }
  if (session.status !== "complete" || session.payment_status !== "paid") return false;
  if (session.mode !== "payment" || session.currency !== "usd" || session.amount_total !== sponsorCents[row.kind]) {
    throw new Error("Unexpected payment details for sponsor booking");
  }
  row.status = "paid";
  row.until = now + termMs;
  return true;
}
