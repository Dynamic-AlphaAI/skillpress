import { uuidPattern } from "@/lib/server/sponsor-checkout";
import { readArt, readLedger } from "@/lib/server/sponsor-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!uuidPattern.test(id)) return new Response(null, { status: 404 });
  try {
    const ledger = await readLedger();
    const paid = Object.values(ledger.data).find(row => row.id === id && row.status === "paid" && row.until > Date.now());
    if (!paid) return new Response(null, { status: 404 });
    const blob = await readArt(id);
    if (!blob || blob.statusCode !== 200) return new Response(null, { status: 404 });
    return new Response(blob.stream, { headers: { "Content-Type": "image/webp", "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=" + Math.max(0, Math.min(300, Math.floor((paid.until - Date.now()) / 1000))) } });
  } catch { return new Response(null, { status: 503 }); }
}
