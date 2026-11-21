import type { LibraryRoom } from "./roomShelves";
import { hallHalfWidth } from "./roomFloor.ts";
import { shelfBase, shelfSpacing } from "./roomLadder.ts";

export interface SponsorCreative {
  name: string;
  slogan: string;
  url: string;
  logo: string;
}

export interface SponsorSpot {
  id: string;
  label: string;
  kind: "wall" | "hanging";
  x: number;
  y: number;
  z: number;
  yaw: number;
  width: number;
  height: number;
  sponsor?: SponsorCreative;
}

// IDs are relative to the entrance and stay consistent when collections change.
const houseSigns: Partial<Record<string, SponsorCreative>> = {
  "ceiling-1": { name: "Armadai", slogan: "The bridge for coding agents.", url: "https://armadai.sh/", logo: "/sponsors/armadai.png" },
  "ceiling-2": { name: "Crawlrr", slogan: "A live feed of autonomous AI agents.", url: "https://crawlrr.com/", logo: "/sponsors/crawlrr.png" },
  "east-03": { name: "Sftir", slogan: "Turn saved videos into searchable ideas.", url: "https://sftir.com/", logo: "/sponsors/sftir.png" },
};

export function planSponsorSpots(hall: Pick<LibraryRoom, "floor" | "stacks">): SponsorSpot[] {
  const { minZ, maxZ, bays } = hall.floor;
  const spots: SponsorSpot[] = [];
  for (const [i, fraction] of [0.145, 0.5, 0.86].entries()) {
    const id = "ceiling-" + (i + 1);
    spots.push({ id, label: ["Entrance hanging sign", "Middle hanging sign", "Rear hanging sign"][i],
      kind: "hanging", x: 0, y: 5.35, z: maxZ - (maxZ - minZ) * fraction, yaw: 0,
      width: 4.5, height: 1.55, sponsor: houseSigns[id] });
  }
  for (const side of [-1, 1]) {
    const wall = side < 0 ? "west" : "east";
    for (let n = 1; ; n++) {
      const z = maxZ - 1.05 - (n - 1) * 2.15;
      if (z <= minZ + 0.88) break;
      // Lift a panel above any overlapping case crown, leaving a clerestory light above it.
      let top = 0;
      bays.forEach((bay, i) => {
        if (bay.yaw !== -side * Math.PI / 2 || Math.abs(z - bay.z) >= 1.9 + 0.91) return;
        const rows = hall.stacks[i].length;
        top = Math.max(top, shelfBase(rows) + rows * shelfSpacing + 0.06);
      });
      const height = top > 4.19 ? 0.83 : 1.29;
      const y = Math.max(5, top + 0.18 + height / 2);
      const number = String(n).padStart(2, "0");
      const id = wall + "-" + number;
      spots.push({ id, label: (side < 0 ? "West" : "East") + " wall · " + number,
        kind: "wall", x: side * (hallHalfWidth - 0.15), y, z, yaw: -side * Math.PI / 2,
        width: 1.64, height, sponsor: houseSigns[id] });
    }
  }
  return spots;
}

export function sponsorWebsite(value: string): string | undefined {
  const text = value.trim();
  if (!text || /\s/.test(text)) return;
  try {
    const url = new URL(/^[a-z][\w+.-]*:/i.test(text) ? text : "https://" + text);
    if (url.protocol === "https:" && url.hostname.includes(".") && !url.username && !url.password) return url.href;
  } catch { /* An incomplete address is handled in the preview form. */ }
}

export const sponsorLogoSize = 512;
export const sponsorTermDays = 30;
export const sponsorCents = { wall: 2000, hanging: 7500 } as const;
export interface PublicBooking {
  reference?: string;
  status: "held" | "paid";
  until: number;
  creative?: SponsorCreative;
}
export interface SponsorInventory {
  checkoutEnabled: boolean;
  bookings: Record<string, PublicBooking>;
}
