/** Display order is also the order of the physical shelves. */
export const categories = [
  { id: "writing-documents", label: "Writing & Documents" },
  { id: "design-media", label: "Design & Media" },
  { id: "software-development", label: "Software & Web Development" },
  { id: "testing-review", label: "Testing & Code Review" },
  { id: "ai-automation", label: "AI Agents & Automation" },
  { id: "research-planning", label: "Research & Planning" },
  { id: "data-analytics", label: "Data & Analytics" },
  { id: "search-discovery", label: "SEO & Search Visibility" },
  { id: "conversion-retention", label: "Conversion & Retention" },
  { id: "campaigns-outreach", label: "Campaigns & Outreach" },
  { id: "sales-pricing", label: "Sales & Pricing" },
  { id: "unfiled", label: "Awaiting Classification" },
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
