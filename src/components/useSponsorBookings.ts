import { useCallback, useEffect, useRef, useState } from "react";
import type { SponsorCreative, SponsorInventory } from "@/lib/sponsors";

const empty: SponsorInventory = { checkoutEnabled: false, bookings: {} };
const key = (id: string) => "skillpress-checkout/" + id;

function savedAttempt(id: string) {
  try { return sessionStorage.getItem(key(id)); } catch { return null; }
}

async function requestCheckout(data: object) {
  const response = await fetch("/api/sponsors/checkout", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Could not reach checkout. Try again.");
  return result;
}

export function useSponsorBookings(onReturn: (id: string) => void) {
  const [inventory, setInventory] = useState(empty);
  const [notice, setNotice] = useState<{ spot: string; text: string } | null>(null);
  const serial = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++serial.current;
    try {
      const response = await fetch("/api/sponsors", { cache: "no-store" });
      if (!response.ok) throw new Error("Unavailable");
      const data: SponsorInventory = await response.json();
      if (serial.current === current) setInventory(prior => JSON.stringify(data) === JSON.stringify(prior) ? prior : data);
    } catch {
      if (serial.current === current) setInventory(prior => prior.checkoutEnabled ? { ...prior, checkoutEnabled: false } : prior);
    }
  }, []);
  useEffect(() => {
    const update = () => { if (!document.hidden) void refresh(); };
    update();
    const timer = window.setInterval(update, 30000);
    window.addEventListener("pageshow", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      clearInterval(timer);
      window.removeEventListener("pageshow", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, [refresh]);
  useEffect(() => {
    const terms = Object.values(inventory.bookings).filter(row => row.status === "paid").map(row => row.until);
    if (!terms.length) return;
    const timer = setTimeout(() => {
      const now = Date.now();
      setInventory(prior => ({ ...prior, bookings: Object.fromEntries(Object.entries(prior.bookings)
        .filter(([, row]) => row.status !== "paid" || row.until > now)) }));
      void refresh();
    }, Math.min(2147483647, Math.max(0, Math.min(...terms) - Date.now())));
    return () => clearTimeout(timer);
  }, [inventory.bookings, refresh]);
  const release = useCallback(async (id: string) => {
    const attempt = savedAttempt(id);
    if (attempt) {
      await requestCheckout({ spot: id, attempt, cancel: true });
      sessionStorage.removeItem(key(id));
      sessionStorage.removeItem(key(id + "/reference"));
    }
    await refresh();
  }, [refresh]);
  useEffect(() => {
    const url = new URL(location.href);
    const id = url.searchParams.get("sponsor"), result = url.searchParams.get("booking");
    if (!id || !result) return;
    onReturn(id);
    url.searchParams.delete("sponsor");
    url.searchParams.delete("booking");
    history.replaceState(history.state, "", url);
    queueMicrotask(() => {
      if (result === "cancelled") {
        void release(id).then(() => setNotice({ spot: id, text: "Checkout closed." }),
          () => setNotice({ spot: id, text: "Checkout closed. You can release your reservation below." }));
      } else {
        setNotice({ spot: id, text: "Check the placement below for your booking status." });
        void refresh();
      }
    });
  }, [onReturn, release, refresh]);
  async function checkout(id: string, creative?: SponsorCreative) {
    let attempt = savedAttempt(id);
    if (!attempt) {
      attempt = crypto.randomUUID();
      try { sessionStorage.setItem(key(id), attempt); }
      catch { throw new Error("Allow session storage in this browser to reserve a sign."); }
    }
    try {
      const result = await requestCheckout({ spot: id, attempt, creative });
      sessionStorage.setItem(key(id + "/reference"), result.reference);
      window.location.assign(result.url);
    } catch (error) {
      void refresh();
      throw error;
    }
  }
  return { inventory, notice, checkout, release, ownsHold: (id: string) => Boolean(inventory.bookings[id]?.reference && inventory.bookings[id].reference === savedAttempt(id + "/reference")) };
}
