/** Catalogue order, also used to sort the shelves within each room. */
export const categories = [
  { id: "writing-documents", label: "Writing & Documents", room: "studio" },
  { id: "design-media", label: "Design & Media", room: "gallery" },
  { id: "illustration", label: "Illustration", room: "gallery" },
  { id: "3d-rendering", label: "3D Graphics & Rendering", room: "gallery" },
  { id: "software-development", label: "Software & Web Development", room: "workshop" },
  { id: "game-development", label: "Game Development", room: "workshop" },
  { id: "testing-review", label: "Testing & Code Review", room: "workshop" },
  { id: "ai-automation", label: "AI Agents & Automation", room: "models" },
  { id: "research-planning", label: "Research & Planning", room: "research" },
  { id: "data-analytics", label: "Data & Analytics", room: "archive" },
  { id: "office-productivity", label: "Office & Productivity", room: "operations" },
  { id: "team-communication", label: "Email & Team Communication", room: "operations" },
  { id: "cloud-infrastructure", label: "Cloud & Infrastructure", room: "infrastructure" },
  { id: "mobile-development", label: "Mobile App Development", room: "mobile" },
  { id: "machine-learning", label: "Machine Learning", room: "models" },
  { id: "databases", label: "Databases & Storage", room: "archive" },
  { id: "payments-billing", label: "Payments & Billing", room: "commerce" },
  { id: "identity-access", label: "Security & Access Management", room: "infrastructure" },
  { id: "search-discovery", label: "SEO & Search Visibility", room: "commerce" },
  { id: "conversion-retention", label: "Conversion & Retention", room: "commerce" },
  { id: "campaigns-outreach", label: "Campaigns & Outreach", room: "commerce" },
  { id: "sales-pricing", label: "Sales & Pricing", room: "commerce" },
  { id: "unfiled", label: "Awaiting Classification", room: "operations" },
] as const;

export type Topic = (typeof categories)[number]["id"];
export const categoryById = (id: string) => categories.find((c) => c.id === id);

// Old shared links can still open a named book, even when its subject was split.
const oldSubjects = new Map<string, Topic>([
  ["documents", "writing-documents"], ["creative", "design-media"],
  ["development", "software-development"], ["enterprise", "writing-documents"],
  ["workflow", "research-planning"], ["marketing", "campaigns-outreach"],
]);

export function resolveCategory(value: string | null, bookTopic?: Topic): Topic | "all" {
  if (!value) return "all";
  const current = categoryById(value);
  if (current) return current.id;
  const replacement = oldSubjects.get(value);
  return replacement ? bookTopic ?? replacement : "all";
}
