import type { SponsorCreative, SponsorSpot } from "@/lib/sponsors";

export function sponsorPrintSize(spot: SponsorSpot) {
  const width = spot.kind === "hanging" ? 1024 : 512;
  return { width, height: Math.round(width * spot.height / spot.width) };
}

/** The upload preview and the 3D sign use the same lettering and square logo space. */
export function paintSponsorArtwork(canvas: HTMLCanvasElement, creative: Pick<SponsorCreative, "name" | "slogan" | "url">, logoImage?: HTMLImageElement) {
  const ctx = canvas.getContext("2d")!;
  const { width: w, height: h } = canvas;
  const { name, slogan, url } = creative;
  const landscape = w / h > 1.65;
  ctx.fillStyle = "#192622";
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = "#af9967";
  ctx.lineWidth = Math.max(1.5, w / 320);
  ctx.strokeRect(w * .024, h * .05, w * .952, h * .9);
  const size = landscape ? Math.min(h * .63, w * .22) : h * .29;
  const left = landscape ? w * .072 : (w - size) / 2;
  const top = landscape ? (h - size) / 2 : h * .11;
  const tx = landscape ? left + size + w * .045 : w / 2;
  const lineWidth = landscape ? w * .94 - tx : w * .89;
  ctx.textAlign = landscape ? "left" : "center";
  ctx.fillStyle = "#fff3d8";
  ctx.font = "bold " + Math.min(w * .114, h * .27) + "px Georgia";
  ctx.fillText(name, tx, h * (landscape ? .50 : .57), lineWidth);
  ctx.fillStyle = "#e2d7bf";
  ctx.font = Math.min(w * .047, h * .105) + "px Georgia";
  ctx.fillText(slogan, tx, h * (landscape ? .68 : .715), lineWidth);
  ctx.fillStyle = "#c6b27d";
  ctx.font = Math.min(w * .038, h * .066) + "px monospace";
  ctx.fillText(url ? new URL(url).host : "", tx, h * .845, lineWidth);
  if (logoImage) {
    const scale = Math.min(size / logoImage.width, size / logoImage.height);
    const iw = logoImage.width * scale, ih = logoImage.height * scale;
    ctx.drawImage(logoImage, left + (size - iw) / 2, top + (size - ih) / 2, iw, ih);
  }
}
