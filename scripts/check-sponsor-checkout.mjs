import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import Stripe from "stripe";

const base = new URL(process.argv[2] ?? "http://localhost:3000");
const secret = process.env.SKILLPRESS_STRIPE_LIVE_KEY;
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname) || !/^(sk|rk)_test_/.test(secret ?? "")) {
  throw new Error("Run against a local Skill Press server with a Stripe sandbox key.");
}
const stripe = new Stripe(secret);
const logo = await sharp("public/sponsors/sftir.png").resize(64, 64).png().toBuffer();
const creative = { name: "Skill Press test", slogan: "Checkout verification", url: "https://skillpress.xyz/",
  logo: "data:image/png;base64," + logo.toString("base64") };

async function post(data) {
  return fetch(new URL("/api/sponsors/checkout", base), {
    method: "POST", headers: { Origin: base.origin, "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
}
async function inventory() {
  const result = await fetch(new URL("/api/sponsors", base));
  assert.equal(result.status, 200);
  return result.json();
}

assert.ok((await inventory()).checkoutEnabled);
for (const [spot, amount] of [["east-03", 2000], ["ceiling-1", 7500]]) {
  assert.ok(!(await inventory()).bookings[spot], "Use an available test placement.");
  const attempts = [randomUUID(), randomUUID()];
  try {
    const responses = await Promise.all(attempts.map(attempt => post({ spot, attempt, creative, amount: 1 })));
    assert.deepEqual(responses.map(r => r.status).sort(), [200, 409]);
    const winner = responses.findIndex(r => r.ok);
    const { url, reference } = await responses[winner].json();
    const hosted = new URL(url);
    assert.equal(hosted.hostname, "checkout.stripe.com");
    const sessionId = hosted.pathname.split("/").at(-1);
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    assert.equal(session.livemode, false);
    assert.equal(session.mode, "payment");
    assert.equal(session.amount_total, amount);
    assert.equal(session.currency, "usd");
    assert.equal(session.metadata.spot, spot);
    assert.equal(session.status, "open");
    assert.equal(session.metadata.booking, reference);
    const hold = (await inventory()).bookings[spot];
    assert.deepEqual(Object.keys(hold).sort(), ["reference", "status", "until"]);
    assert.equal(hold.status, "held");
    assert.equal((await fetch(new URL("/api/sponsors/logo/" + reference, base))).status, 404);
    const resume = await post({ spot, attempt: attempts[winner] });
    assert.ok((await resume.json()).url === url, "A retry must resume the same session.");
    const release = await post({ spot, attempt: attempts[winner], cancel: true });
    assert.equal(release.status, 200);
    const closed = await stripe.checkout.sessions.retrieve(sessionId);
    assert.equal(closed.status, "expired");
    assert.equal(closed.payment_status, "unpaid");
  } finally {
    for (const attempt of attempts) await post({ spot, attempt, cancel: true });
  }
  assert.ok(!(await inventory()).bookings[spot]);
}
console.log("Verified both prices, simultaneous reservations, checkout recovery, cancellation and house placement availability.");
