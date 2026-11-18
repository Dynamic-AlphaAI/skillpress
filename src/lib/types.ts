import type { BookDesign } from "./designs";

export interface Heading {
  level: 1 | 2;
  text: string;
  id: string;
}

export interface Book {
  slug: string;
  rank: number;
  /** skills.sh installs; null when the leaderboard doesn't list the skill yet. */
  installs: number | null;
  license: string;
  category: string;
  /** The Claude Code plugin in the source marketplace that ships this skill. */
  plugin: { name: string; skills: string[] } | null;
  download: { zip: string; skillMd: string; bytes: number; files: number };
  /** `name` from the SKILL.md frontmatter. */
  skillName: string;
  /** `description` from the SKILL.md frontmatter: when the skill triggers. */
  description: string;
  /** The skill's own H1, if it had one. */
  originalTitle: string | null;
  /** Rendered body (frontmatter and leading H1 removed). */
  html: string;
  headings: Heading[];
  words: number;
  readingMinutes: number;
  sourceUrl: string;
  design: BookDesign;
}

export interface Library {
  books: Book[];
  source: { repo: string; url: string; commit: string; commitDate: string; marketplace: string | null };
  ranking: { source: string; metric: string; fetchedAt: string };
  allDownload: { zip: string; bytes: number };
}
