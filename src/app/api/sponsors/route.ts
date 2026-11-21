import { connection } from "next/server";
import { checkoutEnabled, reconcileHolds } from "@/lib/server/sponsor-checkout";
import { publicBookings } from "@/lib/server/sponsor-bookings";
import { readLedger } from "@/lib/server/sponsor-store";

export async function GET() {
  await connection();
  const headers = { "Cache-Control": "private, no-store" };
  if (!process.env.BLOB_READ_WRITE_TOKEN) return Response.json({ checkoutEnabled: false, bookings: {} }, { headers });
  try {
    let ledger = (await readLedger()).data;
    let enabled = checkoutEnabled();
    if (enabled) {
      try { ledger = await reconcileHolds(ledger); }
      catch { enabled = false; }
    }
    return Response.json({ checkoutEnabled: enabled, bookings: publicBookings(ledger, Date.now()) }, { headers });
  } catch {
    return Response.json({ error: "Availability could not be loaded." }, { status: 503, headers });
  }
}
