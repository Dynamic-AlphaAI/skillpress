import assert from "node:assert/strict";
import test from "node:test";
import { applySession, available, publicBookings, stripeApp, termMs } from "../src/lib/server/sponsor-bookings.ts";
import { planSponsorSpots, sponsorCents } from "../src/lib/sponsors.ts";
import { layOutFloor } from "../src/lib/roomFloor.ts";

const [floor] = layOutFloor([1]);
const spots = planSponsorSpots({ floor, stacks: floor.bays.map(() => []) });
const artwork = { name: "Test Press", slogan: "Books for everyone", url: "https://example.com/", logo: "/api/sponsors/logo/art" };
function hold(spot) {
  return { [spot.id]: { id: "reservation", session: "session", attempt: "private", kind: spot.kind, status: "held", until: 50, creative: artwork } };
}
function receipt(spot) {
  return { id: "session", mode: "payment", status: "complete", payment_status: "paid", currency: "usd",
    amount_total: sponsorCents[spot.kind], metadata: { app: stripeApp, spot: spot.id, booking: "reservation" } };
}
test("each house sign can sell for one exact 30-day term and returns to the house at expiration", () => {
  assert.deepEqual(sponsorCents, { wall: 2000, hanging: 7500 });
  assert.equal(termMs, 30 * 24 * 60 * 60 * 1000);
  const house = spots.filter(spot => spot.sponsor);
  assert.equal(house.length, 3);
  for (const spot of house) {
    const ledger = hold(spot);
    const display = now => publicBookings(ledger, now)[spot.id]?.creative ?? spot.sponsor;
    assert.equal(display(1), spot.sponsor);
    assert.equal(available(ledger[spot.id], 99), false);
    assert.equal(applySession(ledger, receipt(spot), 100), true);
    assert.deepEqual(display(100), artwork);
    assert.equal(applySession(ledger, receipt(spot), 200), false);
    assert.equal(applySession(ledger, { ...receipt(spot), status: "expired" }, 201), false);
    assert.equal(available(ledger[spot.id], 100 + termMs - 1), false);
    assert.deepEqual(display(100 + termMs - 1), artwork);
    assert.equal(display(100 + termMs), spot.sponsor);
    assert.equal(available(ledger[spot.id], 100 + termMs), true);
  }
});
test("a held spot keeps artwork and the checkout capability private until Stripe confirms payment", () => {
  const spot = spots[0], ledger = hold(spot), session = receipt(spot);
  assert.deepEqual(publicBookings(ledger, 99), { [spot.id]: { status: "held", until: 50, reference: "reservation" } });
  for (const patch of [{ id: "old" }, { metadata: null }, { metadata: { ...session.metadata, booking: "old" } },
    { payment_status: "unpaid" }, { status: "open" }]) {
    assert.equal(applySession(ledger, { ...session, ...patch }, 99), false);
  }
  for (const patch of [{ amount_total: 1 }, { currency: "cad" }, { mode: "subscription" }]) {
    assert.throws(() => applySession(ledger, { ...session, ...patch }, 99));
    assert.equal(ledger[spot.id].status, "held");
  }
  assert.equal(applySession(ledger, { ...session, status: "expired" }, 100), true);
  assert.deepEqual(publicBookings(ledger, 100), {});
  assert.equal(applySession(ledger, session, 101), false);
});
