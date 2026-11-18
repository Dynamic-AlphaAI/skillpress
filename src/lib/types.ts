import type { Topic } from "./categories";
import type { BookDesign } from "./designs";

export interface Heading {
  level: 1 | 2;
  text: string;
  id: string;
}

/** A skill library (one GitHub repo), from sources.json. */
export interface Source {
  id: string;
  repo: string;
  url: string;
  /** Folder in the repo that holds one directory per skill. */
  path: string;
  commit: string;
  commitDate: string;
  author: string;
  authorId: string;
  authorUrl: string | null;
  /** Credited on the copyright page. */
  copyright: string;
  series: string | null;
  /** Shown with install steps when the skills are meant to be used as a set. */
  bundleNote: string | null;
  download: { zip: string; bytes: number };
}

export interface Plugin {
  name: string;
  marketplace: string;
  /** `owner/repo` to register first; null when the marketplace ships with Claude Code. */
  addMarketplace: string | null;
  skills: string[];
}

export interface Book {
  /** Unique on the shelf; usually the skill name. */
  id: string;
  /** The skill's folder name in its repo. */
  slug: string;
  /** Canonical skill directory in the pinned repository. */
  sourcePath: string;
  source: Source;
  rank: number;
  /** skills.sh installs; null when the leaderboard doesn't list the skill yet. */
  installs: number | null;
  license: string;
  category: Topic;
  /** The Claude Code plugin that ships this skill. */
  plugin: Plugin | null;
  download: { zip: string; skillMd: string; bytes: number; files: number };
  /** `name` from the SKILL.md frontmatter. */
  skillName: string;
  /** `description` from the SKILL.md frontmatter: when the skill triggers. */
  description: string;
  /** The skill's own H1, if it had one. */
  originalTitle: string | null;
  headings: Heading[];
  words: number;
  readingMinutes: number;
  sourceUrl: string;
  design: BookDesign;
}

export interface Author {
  id: string;
  name: string;
  url: string | null;
  count: number;
}

export interface Library {
  books: Book[];
  sources: Source[];
  authors: Author[];
  ranking: { source: string; metric: string; fetchedAt: string };
  allDownload: { zip: string; bytes: number };
}
