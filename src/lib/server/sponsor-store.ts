import { BlobPreconditionFailedError, del, get, put } from "@vercel/blob";
import type { Ledger } from "./sponsor-bookings.ts";

export function storagePrefix() {
  // Isolate local live-key verification and Stripe sandbox data from production inventory.
  const env = process.env.VERCEL_ENV ?? "local";
  const key = process.env.SKILLPRESS_STRIPE_LIVE_KEY;
  const live = key ? /^(sk|rk)_live_/.test(key) : env === "production";
  const mode = live ? "live" : "test";
  return `sponsorships/v1/${env}/${mode}/`;
}
const access = "private" as const;
function ledgerPath() { return storagePrefix() + "placements.json"; }
export async function readLedger(): Promise<{ data: Ledger; etag?: string }> {
  const blob = await get(ledgerPath(), { access, useCache: false });
  if (!blob) return { data: {} };
  if (blob.statusCode !== 200) throw new Error("Unreadable sponsorship ledger");
  return { data: await new Response(blob.stream).json(), etag: blob.blob.etag };
}

/** Each successful write is conditional on exactly the version passed to change(). */
export async function updateLedger(change: (data: Ledger) => boolean): Promise<Ledger> {
  for (let i = 0; i < 8; i++) {
    const { data, etag } = await readLedger();
    if (!change(data)) return data;
    try {
      await put(ledgerPath(), JSON.stringify(data), { access, addRandomSuffix: false,
        contentType: "application/json", ...(etag ? { ifMatch: etag, allowOverwrite: true } : { allowOverwrite: false }) });
      return data;
    } catch (err) {
      if (!(err instanceof BlobPreconditionFailedError) && (etag || !(await readLedger()).etag)) throw err;
    }
  }
  throw new Error("Sponsorship inventory is busy");
}
function artPath(id: string) { return storagePrefix() + "art/" + id + ".webp"; }
export const saveArt = (id: string, data: Buffer) => put(artPath(id), data, { access, addRandomSuffix: false, contentType: "image/webp" });
export const readArt = (id: string) => get(artPath(id), { access, useCache: false });
export const removeArt = (id: string) => del(artPath(id));
