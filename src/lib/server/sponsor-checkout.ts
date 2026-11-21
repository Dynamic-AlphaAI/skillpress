import { randomUUID } from "node:crypto";
import Stripe from "stripe";
import sharp from "sharp";
import { loadLibrary } from "../library";
import { planRooms } from "../roomShelves";
import { planSponsorSpots, sponsorCents, sponsorLogoSize, sponsorWebsite, type SponsorCreative, type SponsorSpot } from "../sponsors";
import { applySession, available, stripeApp, type Booking, type Ledger } from "./sponsor-bookings";
import { readLedger, removeArt, saveArt, updateLedger } from "./sponsor-store";

export const uuidPattern = /^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i;
export class BookingError extends Error {
  status: number;
  constructor(status: number, message: string) { super(message); this.status = status; }
}
export function checkoutEnabled() {
  return Boolean(process.env.SKILLPRESS_STRIPE_LIVE_KEY && process.env.BLOB_READ_WRITE_TOKEN);
}
let client: Stripe | undefined;
export function stripe() {
  if (!checkoutEnabled()) throw new BookingError(503, "Checkout is temporarily unavailable.");
  return client ??= new Stripe(process.env.SKILLPRESS_STRIPE_LIVE_KEY!, { maxNetworkRetries: 2, timeout: 12000 });
}
let spots: Map<string, SponsorSpot> | undefined;
function fullSpot(id: string) {
  if (!spots) spots = new Map(planSponsorSpots(planRooms(loadLibrary().books)[0]).map(s => [s.id, s]));
  const spot = spots.get(id);
  if (!spot) throw new BookingError(400, "Choose a placement in the main hall.");
  return spot;
}

export async function settle(session: Stripe.Checkout.Session) {
  const meta = session.metadata;
  if (meta?.app !== stripeApp) return;
  let released = false;
  const ledger = await updateLedger(data => {
    const changed = applySession(data, session, Date.now());
    released = changed && session.status === "expired";
    return changed;
  });
  if (released && uuidPattern.test(meta.booking)) {
    await removeArt(meta.booking);
  }
  return ledger[meta.spot];
}

// Also fulfill when the customer closes Checkout before returning and a webhook is delayed.
const nextCheck = new Map<string, number>();
export async function reconcileHolds(data: Ledger) {
  const now = Date.now();
  for (const [id, deadline] of nextCheck) if (deadline <= now) nextCheck.delete(id);
  const pending = Object.values(data).filter(row => row.status === "held" && !nextCheck.has(row.id));
  if (!pending.length) return data;
  await Promise.all(pending.map(async row => {
    nextCheck.set(row.id, now + 30000);
    const session = await stripe().checkout.sessions.retrieve(row.session);
    if (session.status !== "open") await settle(session);
  }));
  return (await readLedger()).data;
}

async function artwork(raw: unknown) {
  if (!raw || typeof raw !== "object") throw new BookingError(400, "Add your artwork first.");
  const { name, slogan, url, logo } = raw as Record<string, unknown>;
  const link = typeof url === "string" && url.length <= 240 && sponsorWebsite(url);
  if (typeof name !== "string" || !name.trim() || name.length > 32 ||
      typeof slogan !== "string" || !slogan.trim() || slogan.length > 64 || !link) {
    throw new BookingError(400, "Enter a brand name, short slogan and valid HTTPS website.");
  }
  if (typeof logo !== "string" || logo.length > 1800000 || !/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(logo)) {
    throw new BookingError(400, "Choose a valid logo.");
  }
  try {
    const image = sharp(Buffer.from(logo.slice(22), "base64"), { limitInputPixels: sponsorLogoSize ** 2, failOn: "error" });
    if ((await image.metadata()).format !== "png") throw new Error("Invalid image format");
    return { name: name.trim(), slogan: slogan.trim(), url: link, bytes: await image.webp({ quality: 87 }).toBuffer() };
  } catch { throw new BookingError(400, "The logo could not be opened."); }
}

export async function startCheckout(spotId: string, attempt: string, raw: unknown, origin: string) {
  const api = stripe();
  const spot = fullSpot(spotId);
  if (!uuidPattern.test(attempt)) throw new BookingError(400, "Please reopen checkout.");
  const existing = (await readLedger()).data[spotId];
  if (existing && !available(existing, Date.now())) {
    if (existing.status === "paid") throw new BookingError(409, "This spot is already booked.");
    const prior = await api.checkout.sessions.retrieve(existing.session);
    if (prior.status !== "open") await settle(prior);
    if (prior.status === "open" && existing.attempt === attempt && prior.url) return { url: prior.url, reference: existing.id };
    if (prior.status !== "expired") throw new BookingError(409, "Another sponsor has this spot. Choose a different placement.");
  }
  const art = await artwork(raw);
  const id = randomUUID();
  const creative: SponsorCreative = { name: art.name, slogan: art.slogan, url: art.url, logo: "/api/sponsors/logo/" + id };
  await saveArt(id, art.bytes);
  let session: Stripe.Checkout.Session;
  try {
    session = await api.checkout.sessions.create({
      mode: "payment", allowed_payment_method_types: ["card"], adaptive_pricing: { enabled: false }, client_reference_id: id,
      metadata: { app: stripeApp, spot: spotId, booking: id },
      payment_intent_data: { metadata: { app: stripeApp, spot: spotId, booking: id } },
      line_items: [{ quantity: 1, price_data: { currency: "usd", unit_amount: sponsorCents[spot.kind],
        product_data: { name: "Skill Press · " + spot.label, description: "Exclusive sponsorship for 30 days. One-time payment." } } }],
      expires_at: Math.floor(Date.now() / 1000) + 31 * 60,
      success_url: origin + "/api/sponsors/return?spot=" + spot.id + "&session_id={CHECKOUT_SESSION_ID}",
      cancel_url: origin + "/?walk&sponsor=" + spotId + "&booking=cancelled",
    }, { idempotencyKey: id });
  } catch (err) { await removeArt(id); throw err; }
  const hold: Booking = { id, session: session.id, attempt, kind: spot.kind, status: "held",
    until: session.expires_at * 1000, creative };
  let previous: Booking | undefined;
  let result: Ledger;
  try {
    result = await updateLedger(data => {
      previous = data[spotId];
      if (!available(previous, Date.now())) return false;
      data[spotId] = hold;
      return true;
    });
  } catch {
    // A timed-out write may already have committed. Check ownership before cancelling.
    result = (await readLedger()).data;
    if (!result[spotId]) {
      await api.checkout.sessions.expire(session.id);
      await removeArt(id);
      throw new BookingError(503, "Your spot could not be reserved. Please try again.");
    }
  }
  // Only the winning session URL is ever sent to a browser.
  if (result[spotId]?.session !== session.id) {
    await api.checkout.sessions.expire(session.id);
    await removeArt(id);
    const winner = result[spotId];
    if (winner?.status === "held" && winner.attempt === attempt) {
      const saved = await api.checkout.sessions.retrieve(winner.session);
      if (saved.status === "open" && saved.url) return { url: saved.url, reference: winner.id };
    }
    throw new BookingError(409, "Another sponsor just reserved this spot.");
  }
  if (previous) await removeArt(previous.id).catch(() => {});
  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return { url: session.url, reference: id };
}

export async function cancelCheckout(spot: string, attempt: string) {
  if (!uuidPattern.test(attempt)) return;
  const row = (await readLedger()).data[spot];
  if (!row || row.status !== "held" || row.attempt !== attempt) return;
  const api = stripe().checkout.sessions;
  const expired = await api.expire(row.session).catch(() => api.retrieve(row.session));
  if (expired.status === "open") throw new BookingError(503, "The reservation could not be released. Try again.");
  await settle(expired);
}
