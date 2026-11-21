import { checkoutEnabled, settle, stripe } from "@/lib/server/sponsor-checkout";

export async function POST(request: Request) {
  const secret = process.env.SKILLPRESS_STRIPE_WEBHOOK_SECRET;
  if (!secret || !checkoutEnabled()) return new Response(null, { status: 503 });
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response(null, { status: 400 });
  let event;
  try { event = stripe().webhooks.constructEvent(await request.text(), signature, secret); }
  catch { return new Response(null, { status: 400 }); }
  if (event.type === "checkout.session.completed" || event.type === "checkout.session.expired") {
    try { await settle(event.data.object); }
    catch { return new Response(null, { status: 503 }); }
  }
  return Response.json({ received: true });
}
