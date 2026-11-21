import Image from "next/image";
import { useEffect, useId, useLayoutEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { sponsorCents, sponsorLogoSize, sponsorTermDays, sponsorWebsite, type SponsorInventory, type SponsorCreative, type SponsorSpot } from "@/lib/sponsors";
import { paintSponsorArtwork, sponsorPrintSize } from "./sponsorArtwork";
import { LibraryIcon } from "./LibraryIcons";
import { RoomPicker } from "./RoomPicker";
import s from "./SponsorDialog.module.css";

async function readLogo(file: File) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > 2 * 1024 * 1024) {
    throw new Error("Choose a PNG, JPEG or WebP logo up to 2 MB.");
  }
  const url = URL.createObjectURL(file);
  try {
    const image = new window.Image();
    image.src = url;
    await image.decode();
    const scale = Math.min(1, sponsorLogoSize / Math.max(image.naturalWidth, image.naturalHeight));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
    canvas.getContext("2d")!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return { src: canvas.toDataURL("image/png"), dimensions: image.naturalWidth + " × " + image.naturalHeight + " px" };
  } catch {
    throw new Error("This logo could not be opened. Choose another image.");
  } finally {
    URL.revokeObjectURL(url);
  }
}

type Checkout = (creative?: SponsorCreative) => Promise<void>;

function SignPreview({ spot, name, slogan, url, logo, dimensions }: {
  spot: SponsorSpot; name: string; slogan: string; url: string; logo: string; dimensions?: string;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement>();
  useEffect(() => {
    const next = new window.Image();
    next.onload = () => setImage(next);
    next.src = logo;
    return () => { next.onload = null; };
  }, [logo]);
  useLayoutEffect(() => {
    if (canvas.current) paintSponsorArtwork(canvas.current, { name, slogan, url }, image?.getAttribute("src") === logo ? image : undefined);
  }, [spot, name, slogan, url, image, logo]);
  return <figure className={s.proof}>
    <figcaption>Sign preview{dimensions && <span>Uploaded at {dimensions}</span>}</figcaption>
    <canvas ref={canvas} {...sponsorPrintSize(spot)} role="img" aria-label={"Artwork preview for " + spot.label} />
  </figure>;
}

function PreviewForm({ spot, preview, onPreview, canView, price, enabled, onCheckout }: {
  spot: SponsorSpot; preview?: SponsorCreative; onPreview: (creative?: SponsorCreative) => void; canView: boolean;
  price: string; enabled: boolean; onCheckout: Checkout;
}) {
  const [error, setError] = useState("");
  const [logoError, setLogoError] = useState("");
  const [busy, setBusy] = useState(false);
  const [name, setName] = useState(preview?.name ?? "");
  const [slogan, setSlogan] = useState(preview?.slogan ?? "");
  const [website, setWebsite] = useState(preview?.url ?? "");
  const url = sponsorWebsite(website);
  const [logo, setLogo] = useState<{ src: string; dimensions?: string } | undefined>(
    preview ? { src: preview.logo } : undefined);
  const logoId = useId();

  async function chooseLogo(event: ChangeEvent<HTMLInputElement>) {
    const input = event.currentTarget, file = input.files?.[0];
    setLogoError("");
    setError("");
    if (!file) {
      setLogo(preview ? { src: preview.logo } : undefined);
      return;
    }
    setLogo(undefined);
    try {
      const selected = await readLogo(file);
      if (input.isConnected && input.files?.[0] === file) setLogo(selected);
    } catch (reason) {
      if (input.isConnected && input.files?.[0] === file) setLogoError(reason instanceof Error ? reason.message : "Choose another logo.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const purchase = ((event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null)?.value === "checkout";
    const form = event.currentTarget;
    if (!name.trim() || !slogan.trim() || !url) {
      setError("Enter a brand name, a slogan and a valid HTTPS website.");
      return;
    }
    if (!logo) return;
    setError("");
    setBusy(true);
    try {
      const creative = { name: name.trim(), slogan: slogan.trim(), url, logo: logo.src };
      if (purchase) await onCheckout(creative);
      else onPreview(creative);
    } catch (reason) {
      if (form.isConnected) setError(reason instanceof Error ? reason.message : "Please try again.");
    } finally {
      if (form.isConnected) setBusy(false);
    }
  }
  return <form onSubmit={submit} className={s.form}>
    <div className={s.fields}>
      <label>Brand name<input name="brand" required maxLength={32} value={name} onChange={e => setName(e.target.value)} /></label>
      <label>Website<input name="website" inputMode="url" required maxLength={240} placeholder="example.com" value={website} onChange={e => setWebsite(e.target.value)} /></label>
    </div>
    <label>Slogan<input name="slogan" required maxLength={64} value={slogan} onChange={e => setSlogan(e.target.value)} /></label>
    <div className={s.upload}>
      <label htmlFor={logoId}>Logo</label>
      <p id={logoId + "-help"}><strong>A {sponsorLogoSize} × {sponsorLogoSize} px square works best.</strong> Choose a mark that stands out on dark green and trim excess space around it. Any aspect ratio fits without cropping or stretching.</p>
      <small id={logoId + "-formats"}>PNG, JPEG or WebP · up to 2 MB. Use PNG or WebP for transparency.</small>
      <input id={logoId} type="file" name="logo" required={!preview} accept="image/png,image/jpeg,image/webp"
        aria-describedby={logoId + "-help " + logoId + "-formats" + (logoError ? " " + logoId + "-error" : "")}
        aria-invalid={!!logoError} onChange={chooseLogo} disabled={busy} />
      {logoError && <p role="alert" id={logoId + "-error"}>{logoError}</p>}
    </div>
    {logo && <SignPreview spot={spot} name={name.trim()} slogan={slogan.trim()} url={url ?? ""} logo={logo.src} dimensions={logo.dimensions} />}
    {error && <p role="alert">{error}</p>}
    <div className={s.actions}>
      <button className={s.primary} type="submit" value="checkout" disabled={!logo || busy || !enabled}>Pay {price} with Stripe <LibraryIcon name="arrow" /></button>
      <button type="submit" value="preview" disabled={!logo || busy}>{canView ? "Preview in the hall" : "Preview sign"}</button>
      {preview && <button type="button" onClick={() => onPreview()}>Clear preview</button>}
    </div>
  </form>;
}

export function SponsorDialog({ spots, spot, preview, inventory, notice, ownsHold, onCheckout, onRelease,
  onSelect, onClose, onPreview, onView, canView }: {
  spots: SponsorSpot[]; spot: SponsorSpot; preview?: SponsorCreative; inventory: SponsorInventory;
  notice?: string; ownsHold: boolean; onCheckout: Checkout; onRelease: () => Promise<void>;
  onSelect: (id: string) => void; onClose: () => void; onPreview: (creative?: SponsorCreative) => void;
  onView: () => void; canView: boolean;
}) {
  const [editing, setEditing] = useState("");
  const [error, setError] = useState("");
  const [element, setElement] = useState<HTMLDialogElement | null>(null);
  useLayoutEffect(() => {
    if (!element) return;
    element.showModal();
    return () => element.close();
  }, [element]);
  const booking = inventory.bookings[spot.id];
  const paid = booking?.status === "paid", held = booking?.status === "held";
  const creative = (paid && booking.creative) || preview || spot.sponsor;
  const price = "$" + sponsorCents[spot.kind] / 100;
  const formOpen = !spot.sponsor || Boolean(preview) || editing === spot.id;
  async function changeHold(action: () => Promise<void>) {
    try { setError(""); await action(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : "Please try again."); }
  }
  return <dialog ref={setElement} aria-label="Library sponsorships" className={s.dialog}
    onCancel={e => { e.preventDefault(); e.stopPropagation(); onClose(); }}
    onKeyDown={e => e.stopPropagation()}
    onClick={e => {
      if (e.target !== e.currentTarget) return;
      const r = e.currentTarget.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose();
    }}>
    <header><span>Main hall sponsorships</span><button type="button" aria-label="Close sponsor details" onClick={onClose}><LibraryIcon name="close" /></button></header>
    <RoomPicker label="Placement" accessibleLabel="Sponsor placement" portalContainer={element} side="bottom"
      options={spots.map(p => {
        const row = inventory.bookings[p.id];
        const label = row?.status === "paid" ? row.creative?.name + " · Booked" : row ? "In checkout"
          : (p.sponsor ? p.sponsor.name + " · Available" : "Available");
        return { value: p.id, label: p.label + " · " + label };
      })}
      value={spot.id} onChange={id => { setEditing(""); setError(""); onSelect(id); }} />
    <div className={s.body}>
      {creative ? <>
        <div className={s.brand}><Image src={creative.logo} unoptimized width={70} height={70} alt="" />
          <div>{!paid && preview && <small>Private preview</small>}<h2>{creative.name}</h2><p>{creative.slogan}</p></div>
        </div>
        <div className={s.actions}>
          <a href={creative.url} target="_blank" rel="sponsored noopener noreferrer">Visit {new URL(creative.url).host} ↗</a>
          {canView && <button type="button" onClick={onView}>View sign in hall</button>}
        </div>
      </> : <h2>Sponsor this spot</h2>}
      {notice && <p role="status">{notice}</p>}
      {paid ? <p className={s.terms}>Booked through {new Date(booking.until).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}.</p>
        : <>
          <p className={s.terms}><strong>{price} for {sponsorTermDays} days</strong><br />One payment. Your term starts when your sign goes up.</p>
          {held ? <><p>This placement is being held at checkout.</p>
            {ownsHold && <div className={s.actions}>
              <button type="button" onClick={() => void changeHold(() => onCheckout())}>Resume checkout</button>
              <button type="button" onClick={() => void changeHold(onRelease)}>Release reservation</button>
            </div>}
          </> : <>
            {spot.sponsor && <p>Your logo, slogan and link can take this spot for the full term.</p>}
            {formOpen ? <PreviewForm key={spot.id} spot={spot} preview={preview} onPreview={onPreview} canView={canView}
              price={price} enabled={inventory.checkoutEnabled} onCheckout={onCheckout} />
              : <div className={s.actions}><button className={s.primary} type="button" onClick={() => setEditing(spot.id)}>Book this spot · {price}</button></div>}
            {formOpen && !inventory.checkoutEnabled && <p>Checkout is temporarily unavailable. You can still preview your sign.</p>}
          </>}
        </>}
      {error && <p role="alert">{error}</p>}
    </div>
  </dialog>;
}
