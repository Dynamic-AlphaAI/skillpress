import { settle, stripe } from "@/lib/server/sponsor-checkout";
import { stripeApp } from "@/lib/server/sponsor-bookings";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const hall = new URLSearchParams({ walk: "", booking: "processing" });
  const fallback = url.searchParams.get("spot") ?? "";
  if (/^(ceiling-[1-3]|(east|west)-\d{2})$/.test(fallback)) hall.set("sponsor", fallback);
  const id = url.searchParams.get("session_id") ?? "";
  if (/^cs_(live|test)_[A-Za-z0-9]{8,180}$/.test(id)) {
    try {
      const session = await stripe().checkout.sessions.retrieve(id);
      if (session.metadata?.app === stripeApp) {
        hall.set("sponsor", session.metadata.spot);
        const row = await settle(session);
        if (row?.id === session.metadata.booking && row?.status === "paid") hall.set("booking", "paid");
      }
    } catch { /* Inventory reconciliation retries if Stripe or storage is temporarily unavailable. */ }
  }
  return new Response(null, { status: 303, headers: { Location: "/?" + hall.toString(), "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" } });
}
