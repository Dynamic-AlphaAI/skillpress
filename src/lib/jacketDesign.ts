import type { Topic } from "./categories";

const layouts = ["poster", "bookplate", "column", "folio", "banner", "diagonal"] as const;
export type JacketLayout = (typeof layouts)[number];

type Illustration = "leaves" | "contours" | "weave" | "arches" | "stairs" | "orbits" | "sheets" | "signals";
export interface Jacket {
  layout: JacketLayout;
  illustration: Illustration;
  spot: string;
  plate?: string;
}

// Background, lettering, and two printing inks. The first two also form the spine.
const inks = [
  ["#f4e8cd", "#352c28", "#c04433", "#e4a244"],
  ["#233e58", "#fff0d5", "#78b8ad", "#e69b62"],
  ["#f4b835", "#262a32", "#a63937", "#fcdf9c"],
  ["#d6bee5", "#382743", "#934663", "#efb17d"],
  ["#1d473d", "#f4ecd2", "#b8c785", "#de9566"],
  ["#eb6547", "#211d20", "#ffe6b5", "#812b30"],
  ["#c7dbdc", "#243d49", "#38798b", "#df875e"],
  ["#362c3b", "#f5eadc", "#bd8493", "#edc583"],
  ["#f0d4bd", "#442d36", "#a94659", "#536575"],
  ["#333a8b", "#fff1d9", "#9bb1e4", "#ed9064"],
  ["#ceda85", "#233c32", "#5f8263", "#da7353"],
  ["#7c2c43", "#fff0d5", "#dfa1a2", "#efbc68"],
  ["#e5d8b4", "#303a34", "#5c7766", "#bd6a51"],
  ["#254b70", "#f3e9c7", "#e2b454", "#89b8cf"],
  ["#f0a18b", "#452b34", "#9b4358", "#fbdfb1"],
  ["#233335", "#f6edda", "#8ba783", "#e18058"],
  ["#fbf1dc", "#24263b", "#435dab", "#df613e"],
  ["#69503b", "#fff0cd", "#c99465", "#a9c8bc"],
  ["#8ebbb0", "#1d3837", "#466477", "#f7d77e"],
  ["#413554", "#f4e8cb", "#dda459", "#9cabc8"],
];

const subjects: Record<Topic, Illustration[]> = {
  "writing-documents": ["sheets", "weave", "arches"],
  "design-media": ["arches", "leaves", "weave", "orbits"],
  "software-development": ["stairs", "weave", "arches", "sheets"],
  "testing-review": ["weave", "signals", "orbits"],
  "ai-automation": ["orbits", "weave", "signals"],
  "research-planning": ["contours", "leaves", "stairs"],
  "data-analytics": ["signals", "contours", "orbits"],
  "office-productivity": ["sheets", "weave", "stairs"],
  "team-communication": ["signals", "orbits", "sheets"],
  "cloud-infrastructure": ["arches", "contours", "weave"],
  "mobile-development": ["sheets", "orbits", "stairs"],
  "machine-learning": ["weave", "leaves", "signals"],
  databases: ["stairs", "sheets", "weave"],
  "payments-billing": ["orbits", "stairs", "sheets"],
  "identity-access": ["arches", "weave", "contours"],
  "search-discovery": ["contours", "signals", "leaves"],
  "conversion-retention": ["orbits", "leaves", "signals"],
  "campaigns-outreach": ["signals", "leaves", "sheets"],
  "sales-pricing": ["stairs", "signals", "arches"],
  unfiled: ["sheets", "arches", "weave"],
};

const illustrated: Record<string, { layout: JacketLayout; ink: number }> = {
  copywriting: { layout: "poster", ink: 0 },
  "supabase-postgres-best-practices": { layout: "folio", ink: 13 },
  "obsidian-markdown": { layout: "banner", ink: 3 },
  "opportunity-solution-tree": { layout: "folio", ink: 4 },
  "code-simplification": { layout: "poster", ink: 16 },
  "data-storytelling": { layout: "banner", ink: 1 },
};

export function jacketFor(slug: string, topic: Topic, seed: number) {
  const feature = illustrated[slug];
  const [bg, ink, accent, spot] = inks[feature?.ink ?? seed % inks.length];
  const pool = subjects[topic];
  const jacket: Jacket = {
    layout: feature?.layout ?? layouts[(seed >>> 10) % layouts.length],
    illustration: pool[(seed >>> 20) % pool.length],
    spot,
    ...(feature ? { plate: `/jackets/${slug}.webp` } : {}),
  };
  return { bg, ink, accent, jacket };
}

// Fractions of the spine height. Use the same binding on the CSS and WebGL books.
export function bindingBands(layout: JacketLayout): readonly [number, number][] {
  switch (layout) {
    case "poster": return [[0.103, 0.05], [0.87, 0.018]];
    case "bookplate": return [[0.10, 0.009], [0.125, 0.009], [0.86, 0.009], [0.885, 0.009]];
    case "column": return [[0.105, 0.062], [0.86, 0.062]];
    case "folio": return [[0.115, 0.013], [0.142, 0.006], [0.858, 0.006], [0.88, 0.013]];
    case "banner": return [[0.085, 0.07], [0.852, 0.018]];
    case "diagonal": return [[0.13, 0.012], [0.845, 0.018], [0.885, 0.035]];
  }
}
