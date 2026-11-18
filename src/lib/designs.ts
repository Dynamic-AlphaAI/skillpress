/**
 * Editorial + visual design for each book. Skills imported beyond these get a
 * generated design from `designFor()` so the shelf keeps working as it grows.
 */

export type Motif =
  | "grid"
  | "branches"
  | "slides"
  | "folds"
  | "lines"
  | "targets"
  | "cells"
  | "network"
  | "marble"
  | "swatches"
  | "particles"
  | "code"
  | "frames"
  | "chips"
  | "blocks"
  | "bubbles"
  | "drafts"
  | "steps"
  | "lens";

export interface BookDesign {
  title: string;
  subtitle: string;
  /** Cover board colour. */
  bg: string;
  /** Type colour on the cover and spine. */
  ink: string;
  /** Art accent. */
  accent: string;
  motif: Motif;
  /** Where the title block sits on the cover. */
  titleAt: "top" | "bottom";
  /** Repeat the cover art on the spine (for all-over patterns). */
  patternedSpine?: boolean;
  /** Extra palette for multi-colour motifs. */
  extra?: string[];
  /** Named swatches, for motifs that label their colours. */
  named?: { name: string; colors: string[] }[];
}

export const designs: Record<string, BookDesign> = {
  "frontend-design": {
    title: "Frontend Design",
    subtitle: "Making interfaces that don’t read as templates",
    bg: "#D4472E",
    ink: "#F6EFE3",
    accent: "#1F1B17",
    motif: "grid",
    titleAt: "top",
  },
  "skill-creator": {
    title: "The Skill Creator",
    subtitle: "How to write, test, and improve a skill",
    bg: "#2E392F",
    ink: "#EADFC4",
    accent: "#D6A645",
    motif: "branches",
    titleAt: "top",
  },
  pptx: {
    title: "The Slide Deck",
    subtitle: "Creating, editing, and reading presentations",
    bg: "#E7DECF",
    ink: "#2A2621",
    accent: "#C4552D",
    motif: "slides",
    titleAt: "bottom",
  },
  pdf: {
    title: "The PDF Handbook",
    subtitle: "Reading, merging, filling, and making PDFs",
    bg: "#6A1E2A",
    ink: "#F3E7D9",
    accent: "#E6B3A0",
    motif: "folds",
    titleAt: "top",
  },
  docx: {
    title: "The Word Document",
    subtitle: "Drafting, editing, and redlining .docx files",
    bg: "#1E3A5F",
    ink: "#EFE9DD",
    accent: "#9DBCE0",
    motif: "lines",
    titleAt: "top",
  },
  "webapp-testing": {
    title: "Testing Web Apps",
    subtitle: "Reconnaissance, then action, with Playwright",
    bg: "#474C55",
    ink: "#ECEAE4",
    accent: "#C9DE55",
    motif: "targets",
    titleAt: "bottom",
  },
  xlsx: {
    title: "The Spreadsheet",
    subtitle: "Formulas that survive verification",
    bg: "#2C5C45",
    ink: "#EEEBDF",
    accent: "#F0C14B",
    motif: "cells",
    titleAt: "top",
  },
  "mcp-builder": {
    title: "Building MCP Servers",
    subtitle: "Designing tools that models can use well",
    bg: "#1D1E22",
    ink: "#E8E2D6",
    accent: "#E07A3F",
    motif: "network",
    titleAt: "bottom",
  },
  "canvas-design": {
    title: "Canvas Design",
    subtitle: "A visual philosophy, then the work",
    bg: "#E8D8B6",
    ink: "#1F1D2B",
    accent: "#B4532A",
    motif: "marble",
    titleAt: "bottom",
    patternedSpine: true,
    extra: ["#2E6E73", "#B4532A", "#2B3467", "#D9A441", "#E8D8B6"],
  },
  "brand-guidelines": {
    title: "Brand Guidelines",
    subtitle: "Anthropic’s colors and typography, applied",
    bg: "#F0EEE6",
    ink: "#141413",
    accent: "#D97757",
    motif: "swatches",
    titleAt: "top",
    extra: ["#D97757", "#6A9BCC", "#788C5D", "#B0AEA5", "#141413"],
  },
  "web-artifacts-builder": {
    title: "Building Web Artifacts",
    subtitle: "React, Tailwind, and shadcn/ui in one file",
    bg: "#2F4FA2",
    ink: "#F1EEE6",
    accent: "#F7D488",
    motif: "blocks",
    titleAt: "bottom",
  },
  "theme-factory": {
    title: "The Theme Factory",
    subtitle: "Ten themes, and how to make more",
    bg: "#0F4C5C",
    ink: "#F3EBDD",
    accent: "#E36414",
    motif: "chips",
    titleAt: "top",
    // The ten presets that ship in theme-factory/themes.
    named: [
      { name: "Arctic Frost", colors: ["#d4e4f7", "#4a6fa5", "#c0c0c0", "#fafafa"] },
      { name: "Botanical Garden", colors: ["#4a7c59", "#f9a620", "#b7472a", "#f5f3ed"] },
      { name: "Desert Rose", colors: ["#d4a5a5", "#b87d6d", "#e8d5c4", "#5d2e46"] },
      { name: "Forest Canopy", colors: ["#2d4a2b", "#7d8471", "#a4ac86", "#faf9f6"] },
      { name: "Golden Hour", colors: ["#f4a900", "#c1666b", "#d4b896", "#4a403a"] },
      { name: "Midnight Galaxy", colors: ["#2b1e3e", "#4a4e8f", "#a490c2", "#e6e6fa"] },
      { name: "Modern Minimalist", colors: ["#36454f", "#708090", "#d3d3d3", "#ffffff"] },
      { name: "Ocean Depths", colors: ["#1a2332", "#2d8b8b", "#a8dadc", "#f1faee"] },
      { name: "Sunset Boulevard", colors: ["#e76f51", "#f4a261", "#e9c46a", "#264653"] },
      { name: "Tech Innovation", colors: ["#0066ff", "#00ffff", "#1e1e1e", "#ffffff"] },
    ],
  },
  "doc-coauthoring": {
    title: "Writing Docs Together",
    subtitle: "A workflow for co-authoring with Claude",
    bg: "#7A4E2D",
    ink: "#F5EBDD",
    accent: "#E8935A",
    motif: "drafts",
    titleAt: "top",
  },
  "algorithmic-art": {
    title: "Algorithmic Art",
    subtitle: "Generative work with p5.js and seeded chance",
    bg: "#14213D",
    ink: "#F1E9DA",
    accent: "#F2A541",
    motif: "particles",
    titleAt: "bottom",
    extra: ["#F2A541", "#E4572E", "#7FB069", "#5FA8D3", "#F1E9DA"],
  },
  "internal-comms": {
    title: "Internal Comms",
    subtitle: "Updates, newsletters, and incident reports",
    bg: "#B9C7B0",
    ink: "#1E2A22",
    accent: "#C2452D",
    motif: "bubbles",
    titleAt: "top",
  },
  "slack-gif-creator": {
    title: "Making GIFs for Slack",
    subtitle: "Small animations that fit the channel",
    bg: "#F3B7C3",
    ink: "#3A1F2B",
    accent: "#D9412B",
    motif: "frames",
    titleAt: "top",
  },
  "claude-api": {
    title: "The Claude API",
    subtitle: "Models, tools, streaming, and caching",
    bg: "#3D2E5C",
    ink: "#EFE7F5",
    accent: "#F0A35E",
    motif: "code",
    titleAt: "top",
  },
  "academy-guide": {
    title: "The Academy Guide",
    subtitle: "Pointing people to the right lesson",
    bg: "#2F4858",
    ink: "#EEE6D8",
    accent: "#F6AE2D",
    motif: "steps",
    titleAt: "bottom",
  },
  "discernment-nudge": {
    title: "The Discernment Nudge",
    subtitle: "Questions that help check the answer",
    bg: "#D9A441",
    ink: "#241C10",
    accent: "#241C10",
    motif: "lens",
    titleAt: "top",
    extra: ["#FFF6E5"],
  },
};

const fallbackPalettes: Pick<BookDesign, "bg" | "ink" | "accent">[] = [
  { bg: "#3B4A6B", ink: "#EEE8DC", accent: "#E8A33D" },
  { bg: "#8C3B2F", ink: "#F4EADB", accent: "#F2C49B" },
  { bg: "#D8CFBC", ink: "#26231F", accent: "#3F6E5A" },
  { bg: "#4E3B5C", ink: "#EFE6F0", accent: "#E5A0B8" },
  { bg: "#B8892D", ink: "#211C14", accent: "#F6EEDC" },
  { bg: "#22363A", ink: "#E4EDE8", accent: "#7FC2B0" },
];
const fallbackMotifs: Motif[] = ["grid", "branches", "lines", "network", "cells", "folds", "targets", "slides", "blocks", "steps", "bubbles"];

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function titleCase(slug: string) {
  return slug
    .split("-")
    .map((w) => (w.length <= 4 && /^[a-z]+$/.test(w) && !/^(the|and|for|with)$/.test(w) ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)))
    .join(" ");
}

export function designFor(slug: string, fallbackTitle?: string, fallbackSubtitle?: string): BookDesign {
  if (designs[slug]) return designs[slug];
  const h = hashString(slug);
  return {
    title: fallbackTitle ?? titleCase(slug),
    subtitle: fallbackSubtitle ?? "A skill from the library",
    ...fallbackPalettes[h % fallbackPalettes.length],
    motif: fallbackMotifs[(h >>> 8) % fallbackMotifs.length],
    titleAt: h & 1 ? "top" : "bottom",
  };
}
