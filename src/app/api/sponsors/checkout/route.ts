import { BookingError, cancelCheckout, checkoutEnabled, startCheckout, uuidPattern } from "@/lib/server/sponsor-checkout";

async function readRequest(request: Request) {
  if (!request.headers.get("content-type")?.startsWith("application/json")) throw new BookingError(415, "Send a JSON booking request.");
  const reader = request.body?.getReader();
  if (!reader) throw new BookingError(400, "Missing booking request.");
  const chunks: Uint8Array[] = [];
  let length = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    length += value.length;
    if (length > 1850000) {
      await reader.cancel();
      throw new BookingError(413, "The artwork is too large.");
    }
    chunks.push(value);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); }
  catch { throw new BookingError(400, "Invalid booking request."); }
}

export async function POST(request: Request) {
  try {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (!origin || !host || !["http://" + host, "https://" + host].includes(origin)) throw new BookingError(403, "Open checkout from the library.");
    const data = await readRequest(request);
    if (!data || typeof data.spot !== "string" || !/^(ceiling-[1-3]|(east|west)-\d{2})$/.test(data.spot) ||
        typeof data.attempt !== "string" || !uuidPattern.test(data.attempt)) throw new BookingError(400, "Invalid placement or checkout attempt.");
    if (!checkoutEnabled()) throw new BookingError(503, "Checkout is temporarily unavailable.");
    if (data.cancel === true) {
      await cancelCheckout(data.spot, data.attempt);
      return Response.json({ ok: true });
    }
    const site = process.env.VERCEL_ENV === "production" ? "https://skillpress.xyz" : origin;
    return Response.json(await startCheckout(data.spot, data.attempt, data.creative, site));
  } catch (error) {
    const known = error instanceof BookingError;
    return Response.json({ error: known ? error.message : "Checkout is temporarily unavailable. Please try again." }, { status: known ? error.status : 503 });
  }
}
