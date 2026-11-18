/**
 * The four skill sets named in the anthropics/skills README. The repo doesn't tag skills
 * individually, so membership here is editorial (Document Skills mirrors its plugin).
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

export function categoryFor(slug: string, plugin: string | null): string {
  if (membership[slug]) return membership[slug];
  if (plugin === "document-skills") return "documents";
  return "development";
}

export const categoryById = (id: string) => categories.find((c) => c.id === id);
