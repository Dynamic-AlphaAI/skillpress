/**
 * Subjects on the shelf. The first four are the skill sets named in the anthropics/skills
 * README (the repo doesn't tag skills individually, so membership is editorial);
 * Workflow & Process holds methodology libraries like Superpowers; Marketing & Growth holds
 * Corey Haines's marketing skills. A skill not listed in
 * `membership` falls back to its library's defaultCategory in sources.json.
 */
export interface Category {
  id: string;
  label: string;
  short: string;
  blurb: string;
}

export const categories: Category[] = [
  {
    id: "documents",
    label: "Document Skills",
    short: "Documents",
    blurb: "The skills behind Claude’s own file creation: Word, PDF, PowerPoint, and Excel.",
  },
  {
    id: "creative",
    label: "Creative & Design",
    short: "Creative",
    blurb: "Visual work — interfaces, posters, generative art, themes, and animation.",
  },
  {
    id: "development",
    label: "Development & Technical",
    short: "Development",
    blurb: "Building and testing software: APIs, MCP servers, web apps, and skills themselves.",
  },
  {
    id: "enterprise",
    label: "Enterprise & Communication",
    short: "Enterprise",
    blurb: "Writing and working inside an organization: comms, brand, docs, and learning.",
  },
  {
    id: "workflow",
    label: "Workflow & Process",
    short: "Workflow",
    blurb: "How an agent works: brainstorming, planning, test-driven development, debugging, review, and git.",
  },
  {
    id: "marketing",
    label: "Marketing & Growth",
    short: "Marketing",
    blurb: "Conversion, copy, SEO, paid, analytics, retention, pricing, and sales.",
  },
];

const membership: Record<string, string> = {
  docx: "documents",
  pdf: "documents",
  pptx: "documents",
  xlsx: "documents",
  "algorithmic-art": "creative",
  "canvas-design": "creative",
  "frontend-design": "creative",
  "slack-gif-creator": "creative",
  "theme-factory": "creative",
  "claude-api": "development",
  "mcp-builder": "development",
  "skill-creator": "development",
  "web-artifacts-builder": "development",
  "webapp-testing": "development",
  "academy-guide": "enterprise",
  "brand-guidelines": "enterprise",
  "discernment-nudge": "enterprise",
  "doc-coauthoring": "enterprise",
  "internal-comms": "enterprise",
};

export function categoryFor(id: string, fallback: string): string {
  return membership[id] ?? (categories.some((c) => c.id === fallback) ? fallback : "development");
}

export const categoryById = (id: string) => categories.find((c) => c.id === id);
