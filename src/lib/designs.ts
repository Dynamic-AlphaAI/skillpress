import { jacketFor, type Jacket } from "./jacketDesign";
import type { Topic } from "./categories";

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
  | "lens"
  | "series"
  | "marketing";

export interface BookDesign {
  title: string;
  subtitle: string;
  jacket?: Jacket;
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
  /** For books in a numbered series: the series name and this volume. */
  series?: string;
  volume?: number;
  volumes?: number;
  /** Small label across the top of the cover (a series line or a topic). */
  kicker?: string;
  /** Picks a sub-motif for motifs that have several. */
  variant?: string;
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

  // Superpowers by Jesse Vincent — one series, numbered in the order the workflow uses them.
  "using-superpowers": {
    title: "Using Superpowers",
    subtitle: "How to find and use a skill before anything else",
    bg: "#23395B",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 1,
    volumes: 15,
  },
  "brainstorming": {
    title: "Brainstorming",
    subtitle: "Shaping an idea into a design before building it",
    bg: "#8E3B46",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 2,
    volumes: 15,
  },
  "writing-plans": {
    title: "Writing Plans",
    subtitle: "Plans an engineer new to the codebase can follow",
    bg: "#3D5A40",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 3,
    volumes: 15,
  },
  "using-git-worktrees": {
    title: "Using Git Worktrees",
    subtitle: "An isolated workspace for every piece of work",
    bg: "#4C3B6E",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 4,
    volumes: 15,
  },
  "executing-plans": {
    title: "Executing Plans",
    subtitle: "Implementing a plan yourself, task by task",
    bg: "#9C5B2E",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 5,
    volumes: 15,
  },
  "subagent-driven-development": {
    title: "Subagent-Driven Development",
    subtitle: "A fresh subagent per task, reviewed between",
    bg: "#1E5F74",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 6,
    volumes: 15,
  },
  "dispatching-parallel-agents": {
    title: "Dispatching Parallel Agents",
    subtitle: "Splitting independent work across agents",
    bg: "#6D2E46",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 7,
    volumes: 15,
  },
  "test-driven-development": {
    title: "Test-Driven Development",
    subtitle: "No production code without a failing test first",
    bg: "#8C2F39",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 8,
    volumes: 15,
  },
  "systematic-debugging": {
    title: "Systematic Debugging",
    subtitle: "Find the root cause before attempting a fix",
    bg: "#3A3F58",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 9,
    volumes: 15,
  },
  "verification-before-completion": {
    title: "Verification Before Completion",
    subtitle: "Evidence before claims, always",
    bg: "#5E6B2F",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 10,
    volumes: 15,
  },
  "requesting-code-review": {
    title: "Requesting Code Review",
    subtitle: "Checking work against requirements before merging",
    bg: "#7A3E1D",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 11,
    volumes: 15,
  },
  "receiving-code-review": {
    title: "Receiving Code Review",
    subtitle: "Technical rigor, not performative agreement",
    bg: "#2C4A6E",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 12,
    volumes: 15,
  },
  "finishing-a-development-branch": {
    title: "Finishing a Development Branch",
    subtitle: "Verify, choose how the work lands, clean up",
    bg: "#574B3A",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 13,
    volumes: 15,
  },
  "writing-skills": {
    title: "Writing Skills",
    subtitle: "Test-driven development, applied to skills",
    bg: "#24443A",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 14,
    volumes: 15,
  },
  "diagnosing-superpowers": {
    title: "Diagnosing Superpowers",
    subtitle: "Working out why a session went wrong",
    bg: "#42305A",
    ink: "#F3EBDD",
    accent: "#E8B04B",
    motif: "series",
    titleAt: "bottom",
    series: "Superpowers",
    volume: 15,
    volumes: 15,
  },
};

/**
 * Marketing Skills by Corey Haines: one series, colour-coded by the topics in the repo's
 * README (the README files 35 of the 53; the rest are placed here by hand). Shades step
 * darker within a topic so neighbouring spines stay distinct.
 */
const marketingTopics: Record<string, { label: string; bg: string; accent: string; variant: string }> = {
  conversion: { label: "Conversion Optimization", bg: "#B6452C", accent: "#F6C98E", variant: "funnel" },
  content: { label: "Content & Copy", bg: "#2E5266", accent: "#F2C57C", variant: "quote" },
  seo: { label: "SEO & Discovery", bg: "#3F6B3A", accent: "#F0D78C", variant: "search" },
  paid: { label: "Paid & Distribution", bg: "#A86A12", accent: "#2A1A06", variant: "broadcast" },
  measurement: { label: "Measurement & Testing", bg: "#4E4372", accent: "#F3B97A", variant: "abtest" },
  retention: { label: "Retention", bg: "#94315F", accent: "#F7C6A3", variant: "loop" },
  growth: { label: "Growth Engineering", bg: "#226B5A", accent: "#F4D06F", variant: "curve" },
  strategy: { label: "Strategy & Monetization", bg: "#1F2A44", accent: "#E9B872", variant: "matrix" },
  sales: { label: "Sales & RevOps", bg: "#6E4424", accent: "#F1CB8B", variant: "pipeline" },
};
const marketingBooks: [slug: string, title: string, subtitle: string, topic: string][] = [
  ["cro", "Conversion Rate Optimization", "Pages and forms that convert", "conversion"],
  ["signup", "Signup Flow CRO", "Registration flows people finish", "conversion"],
  ["onboarding", "Onboarding CRO", "From signup to activation", "conversion"],
  ["popups", "Popup CRO", "Modals and overlays that earn their place", "conversion"],
  ["paywalls", "Paywalls & Upgrade Screens", "In-app upgrade moments", "conversion"],
  ["lead-magnets", "Lead Magnets", "Free resources that capture demand", "conversion"],
  ["copywriting", "Copywriting", "Marketing page copy", "content"],
  ["copy-editing", "Copy Editing", "Editing and polishing existing copy", "content"],
  ["cold-email", "Cold Email Writing", "B2B outreach emails and sequences", "content"],
  ["emails", "Email Sequence Design", "Automated email flows", "content"],
  ["social", "Social Content", "Posts, scheduling, and strategy", "content"],
  ["content-strategy", "Content Strategy", "Deciding what to publish, and why", "content"],
  ["image", "Images", "Generate, design, or photograph marketing images", "content"],
  ["video", "Video", "Product demos and repeatable video with AI tools or code", "content"],
  ["sms", "SMS Marketing", "Text-message campaigns and flows", "content"],
  ["seo-audit", "SEO Audit", "Technical and on-page SEO", "seo"],
  ["ai-seo", "AI SEO", "Optimizing for AI search: AEO, GEO, LLMO", "seo"],
  ["link-building", "Link Building", "Earned links and mentions on AI-cited pages", "seo"],
  ["programmatic-seo", "Programmatic SEO", "Pages generated at scale", "seo"],
  ["site-architecture", "Site Architecture", "Hierarchy, navigation, and URL structure", "seo"],
  ["competitors", "Competitor & Alternative Pages", "Comparison pages that rank and convert", "seo"],
  ["schema", "Schema Markup", "Structured data for search", "seo"],
  ["aso", "ASO Audit", "App store optimization", "seo"],
  ["directory-submissions", "Directory Submissions", "Product Hunt, G2, Capterra, and the rest", "seo"],
  ["ads", "Paid Ads", "Google, Meta, and LinkedIn campaigns", "paid"],
  ["ad-creative", "Ad Creative", "Generating and iterating ad creative in bulk", "paid"],
  ["events", "Event Marketing", "Webinars, conferences, sponsorships, speaking", "paid"],
  ["influencer-marketing", "Influencer & Creator Marketing", "Working with creators", "paid"],
  ["public-relations", "Public Relations & Earned Media", "Getting covered", "paid"],
  ["analytics", "Analytics Tracking", "Event tracking setup", "measurement"],
  ["conversion-tracking", "Conversion Tracking", "Pixels, tags, and server-side delivery", "measurement"],
  ["ab-testing", "A/B Test Setup", "Experiment design", "measurement"],
  ["attribution", "Attribution", "Which marketing actually drives revenue", "measurement"],
  ["churn-prevention", "Churn Prevention", "Cancel flows, save offers, and dunning", "retention"],
  ["co-marketing", "Co-Marketing", "Partners and joint campaigns", "growth"],
  ["free-tools", "Free Tool Strategy", "Engineering as marketing", "growth"],
  ["referrals", "Referral & Affiliate Programs", "Customers who bring customers", "growth"],
  ["community-marketing", "Community Marketing", "Building a community people stay in", "growth"],
  ["marketing-loops", "Marketing Loops", "Recurring jobs an agent runs on a cadence", "growth"],
  ["product-marketing", "Product Marketing Context", "The foundation every other skill reads first", "strategy"],
  ["marketing-plan", "Marketing Plan", "A full go-to-market plan, sequenced", "strategy"],
  ["marketing-ideas", "Marketing Ideas for SaaS", "140 ideas to start from", "strategy"],
  ["marketing-psychology", "Marketing Psychology", "Mental models and how buyers decide", "strategy"],
  ["marketing-council", "Marketing Council", "A simulated board of famous marketers", "strategy"],
  ["launch", "Launch Strategy", "Product launches and announcements", "strategy"],
  ["pricing", "Pricing Strategy", "Pricing, packaging, and monetization", "strategy"],
  ["offers", "Offer Design", "Value stacks, guarantees, and honest urgency", "strategy"],
  ["competitor-profiling", "Competitor Profiling", "Dated, fair profiles of the competition", "strategy"],
  ["customer-research", "Customer Research", "What customers say, and what it means", "strategy"],
  ["reverse-engineer-marketing", "Reverse Engineer Marketing", "Growth teardowns, with plays to copy", "strategy"],
  ["revops", "RevOps", "Lifecycle, scoring, routing, and pipeline", "sales"],
  ["sales-enablement", "Sales Enablement", "Decks, one-pagers, objection docs, demo scripts", "sales"],
  ["prospecting", "Prospecting", "Finding and qualifying buyers", "sales"],
];

const shade = (hex: string, t: number) =>
  "#" +
  [1, 3, 5]
    .map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * (1 - t)).toString(16).padStart(2, "0"))
    .join("");

const seen: Record<string, number> = {};
for (const [slug, title, subtitle, topic] of marketingBooks) {
  const t = marketingTopics[topic];
  const k = (seen[topic] = (seen[topic] ?? -1) + 1);
  designs[slug] = {
    title,
    subtitle,
    bg: shade(t.bg, (k % 4) * 0.07),
    ink: "#F4EEE3",
    accent: t.accent,
    motif: "marketing",
    variant: t.variant,
    titleAt: "bottom",
    series: "Marketing Skills",
    kicker: t.label,
  };
}

// Some upstream headings are API command names or simply “Overview”.
const coverTitles: Record<string, string> = {
  "obsidian-markdown": "Obsidian Flavored Markdown",
  "obsidian-bases": "Building Obsidian Bases",
  "json-canvas": "Drawing with JSON Canvas",
  "interview-me": "Clarifying Software Requirements",
  "outcome-roadmap": "Outcome-Based Roadmaps",
  "review-resume": "Reviewing a Product Manager’s Résumé",
  "opportunity-solution-tree": "The Opportunity Solution Tree",
  "comment-code-generate-a-tutorial": "Turn Code into a Tutorial",
  "create-readme": "Writing a Project README",
  "breakdown-feature-prd": "Writing a Feature Requirements Document",
  "architecture-blueprint-generator": "Mapping a Software Architecture",
  "javascript-typescript-jest": "Testing JavaScript and TypeScript with Jest",
  "unit-test-vue-pinia": "Testing Vue and Pinia",
  "editorconfig": "A Shared EditorConfig",
  "next-intl-add-language": "Adding a Language with next-intl",
  "meeting-minutes": "Taking Meeting Minutes",
  "mentoring-juniors": "Mentoring Junior Developers",
  "csharp-xunit": "Testing C# with xUnit",
  "breakdown-test": "Planning a Test Strategy",
  "gws-admin-reports": "Audit Google Workspace Activity",
  "gws-calendar": "Google Calendar",
  "gws-calendar-agenda": "Read Your Calendar Agenda",
  "gws-calendar-insert": "Create a Calendar Event",
  "gws-chat": "Google Chat",
  "gws-chat-send": "Send a Chat Message",
  "gws-classroom": "Google Classroom",
  "gws-docs": "Google Docs",
  "gws-docs-write": "Append Text to a Google Doc",
  "gws-drive": "Google Drive",
  "gws-drive-upload": "Upload a File to Drive",
  "gws-events": "Google Workspace Events",
  "alt-text": "Writing Alt Text for Charts",
  "brand-yml": "A Brand System for Data Products",
  "ggsql": "Drawing Charts with SQL",
  "quarto-authoring": "Publishing with Quarto",
  "r-tidyverse-style": "Tidyverse Style for R",
  "shiny-bslib-theming": "Theming Shiny Apps",
  "edge-to-edge": "Edge-to-Edge Android Layouts",
  "adaptive": "Designing for Foldables and Tablets",
  "ink-custom-brush-builder": "Drawing Custom Ink Brushes",
  "navigation-event": "Predictive Back Navigation",
  "wear-widgets": "Designing Wear OS Widgets",
  "email-best-practices": "Designing Reliable Email",
  "gws-events-renew": "Renew an Event Subscription",
  "gws-events-subscribe": "Subscribe to Workspace Events",
  "gws-forms": "Google Forms",
  "gws-gmail": "Gmail",
  "gws-gmail-forward": "Forward a Gmail Message",
  "gws-gmail-read": "Read a Gmail Message",
  "gws-gmail-reply": "Reply to a Gmail Message",
  "gws-gmail-reply-all": "Reply to Everyone in a Thread",
  "gws-gmail-send": "Send a Gmail Message",
  "gws-gmail-triage": "Triage Your Gmail Inbox",
  "gws-gmail-watch": "Watch for New Gmail Messages",
  "gws-keep": "Google Keep",
  "gws-meet": "Google Meet",
  "gws-modelarmor": "Google Model Armor",
  "gws-modelarmor-create-template": "Create a Model Armor Template",
  "gws-modelarmor-sanitize-prompt": "Screen Prompts with Model Armor",
  "gws-modelarmor-sanitize-response": "Screen Responses with Model Armor",
  "gws-people": "Google Contacts",
  "gws-script": "Google Apps Script",
  "gws-script-push": "Publish an Apps Script Project",
  "gws-shared": "Workspace CLI Essentials",
  "gws-sheets": "Google Sheets",
  "gws-sheets-append": "Append Rows to Google Sheets",
  "gws-sheets-read": "Read Values from Google Sheets",
  "gws-slides": "Google Slides",
  "gws-tasks": "Google Tasks",
  "gws-workflow": "Google Workspace Workflows",
  "gws-workflow-email-to-task": "Turn an Email into a Task",
  "gws-workflow-file-announce": "Announce a Drive File in Chat",
  "gws-workflow-meeting-prep": "Prepare for Your Next Meeting",
  "gws-workflow-standup-report": "Prepare a Standup Report",
  "gws-workflow-weekly-digest": "Build a Weekly Workspace Digest",
  "hf-cli": "The Hugging Face CLI",
  "hf-mem": "Estimate GPU Memory for a Model",
  "huggingface-community-evals": "Community Model Evaluations",
  "huggingface-paper-publisher": "Publish a Paper on Hugging Face",
};

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

export function designFor(slug: string, topic: Topic, fallbackTitle?: string, fallbackSubtitle?: string, upstreamSlug = slug): BookDesign {
  const original = designs[slug];
  if (original && original.motif !== "marketing" && original.motif !== "series") return original;
  const print = jacketFor(slug, topic, hashString(slug));
  if (original) return { ...original, ...print };
  return {
    title: coverTitles[slug] ?? fallbackTitle ?? titleCase(upstreamSlug),
    subtitle: fallbackSubtitle ?? "A skill from the library",
    motif: "grid",
    titleAt: "top",
    ...print,
  };
}
