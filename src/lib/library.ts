import fs from "node:fs";
import path from "node:path";
import { parseSkill } from "../../scripts/parse-skill.mjs";
import MarkdownIt, { type Token } from "markdown-it";
import { categories } from "./categories";
import { categoryFor } from "./classifyTopic";
import { designFor } from "./designs";
import type { Author, Book, Heading, Library, Source } from "./types";

const CONTENT = path.join(process.cwd(), "content");

interface Catalog {
  sources: Source[];
  ranking: Library["ranking"];
  allDownload: Library["allDownload"];
  books: (Pick<Book, "id" | "slug" | "rank" | "installs" | "license" | "plugin" | "download"> & {
    source: string;
    sourcePath?: string;
    credit?: Pick<Source, "author" | "authorId" | "authorUrl" | "copyright">;
    topic?: Book["category"];
    description?: string;
    platforms?: Book["platforms"];
    covers?: Book["covers"];
  })[];
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

/** Typesetting nicety: ALL-CAPS headings read as shouting in a serif book. */
function displayHeading(text: string) {
  const letters = text.replace(/[^A-Za-z]/g, "");
  if (letters.length > 3 && letters === letters.toUpperCase()) {
    return text.toLowerCase().replace(/(^|\s)(\p{L})/gu, (_, sp, ch) => sp + ch.toUpperCase());
  }
  return text;
}

function inlineText(token: Token | undefined) {
  if (!token?.children) return token?.content ?? "";
  return token.children
    .filter((c) => c.type === "text" || c.type === "code_inline")
    .map((c) => c.content)
    .join("");
}

function createRenderer(blobBase: string) {
  // html:false escapes raw HTML in the skills (e.g. <evaluation> examples) instead of injecting it.
  const md = new MarkdownIt({ html: false, linkify: false, typographer: true });
  md.disable("replacements"); // keep `--flags` and `(c)` literal; smart quotes only

  const defaultLink = md.renderer.rules.link_open ?? ((t, i, o, _e, self) => self.renderToken(t, i, o));
  md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
    const token = tokens[idx];
    const href = String(token.attrGet("href") ?? "");
    if (href.startsWith("#")) {
      token.attrSet("data-internal", "true");
    } else {
      if (!/^[a-z]+:/i.test(href) && !href.startsWith("/")) {
        token.attrSet("href", new URL(href, blobBase).toString());
      }
      token.attrSet("target", "_blank");
      token.attrSet("rel", "noopener noreferrer");
    }
    return defaultLink(tokens, idx, options, env, self);
  };
  return md;
}

export function readCatalog(): Catalog {
  return JSON.parse(fs.readFileSync(path.join(CONTENT, "catalog.json"), "utf8"));
}

function skillPath(entry: Catalog["books"][number], source: Source) {
  return entry.sourcePath ?? `${source.path}/${entry.slug}`;
}

export function readSkillFile(id: string) {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(id)) throw new Error("Invalid skill id");
  return parseSkill(fs.readFileSync(path.join(CONTENT, "skills", id, "SKILL.md"), "utf8"), id);
}

function parseEdition(entry: Catalog["books"][number], source: Source) {
  const { data, content } = readSkillFile(entry.id);
  const blobBase = `${source.url}/blob/${source.commit}/${skillPath(entry, source)}/`;
  const md = createRenderer(blobBase);
  const tokens = md.parse(content, {});

  // Lift a leading H1 onto the title page instead of repeating it in the body.
  let originalTitle: string | null = null;
  const firstBlock = tokens.findIndex((t) => t.block && t.type !== "hr");
  if (firstBlock !== -1 && tokens[firstBlock].type === "heading_open" && tokens[firstBlock].tag === "h1") {
    originalTitle = inlineText(tokens[firstBlock + 1]);
    tokens.splice(firstBlock, 3);
  }

  const headings: Heading[] = [];
  const seen = new Map<string, number>();
  tokens.forEach((t, i) => {
    if (t.type !== "heading_open") return;
    const inline = tokens[i + 1];
    const raw = inlineText(inline);
    const base = slugify(raw) || "section";
    const n = seen.get(base) ?? 0;
    seen.set(base, n + 1);
    const id = n ? `${base}-${n}` : base;
    t.attrSet("id", id);
    const shown = displayHeading(raw);
    if (shown !== raw && inline.children) {
      inline.children = inline.children.map((c) => {
        if (c.type === "text") c.content = displayHeading(c.content);
        return c;
      });
    }
    if (t.tag === "h1" || t.tag === "h2") headings.push({ level: t.tag === "h1" ? 1 : 2, text: shown, id });
  });

  return { data, content, originalTitle, headings, tokens, md };
}

/** The edition route only accepts ids from the checked-in catalogue. */
export function readEdition(id: string): string | null {
  const catalog = readCatalog();
  const entry = catalog.books.find((b) => b.id === id);
  const source = entry && catalog.sources.find((s) => s.id === entry.source);
  if (!entry || !source) return null;
  const { md, tokens } = parseEdition(entry, source);
  return md.renderer.render(tokens, md.options, {});
}

export function loadLibrary(): Library {
  const catalog = readCatalog();
  const sources = new Map(catalog.sources.map((src) => [src.id, src]));
  const books: Book[] = catalog.books.map((entry) => {
    const publisher = sources.get(entry.source)!;
    const source = entry.credit ? { ...publisher, ...entry.credit } : publisher;
    const { data, content, originalTitle, headings } = parseEdition(entry, source);
    const words = content.split(/\s+/).filter(Boolean).length;
    const description = entry.description ?? String(data.description ?? "").trim();
    const category = entry.topic ?? categoryFor(source.repo, entry.slug, description);

    return {
      id: entry.id,
      slug: entry.slug,
      sourcePath: skillPath(entry, source),
      source,
      rank: entry.rank,
      installs: entry.installs,
      license: entry.license,
      category,
      platforms: [...new Set([...(source.platforms ?? []), ...(entry.platforms ?? [])])],
      covers: entry.covers ?? [],
      plugin: entry.plugin,
      download: entry.download,
      skillName: String(data.name ?? entry.slug),
      description,
      originalTitle,
      headings,
      words,
      readingMinutes: Math.max(1, Math.round(words / 230)),
      sourceUrl: `${source.url}/tree/${source.commit}/${skillPath(entry, source)}`,
      design: designFor(
        entry.id,
        category,
        originalTitle && !/^(overview|introduction|instructions)$/i.test(originalTitle) ? originalTitle : undefined,
        `A field guide from ${source.author}`,
        entry.slug,
      ),
    };
  });

  // Keep install rank within each subject as the collection grows.
  const grouped = categories.flatMap(({ id }) => books.filter((book) => book.category === id));

  const authorsById = new Map<string, Author>(catalog.sources.map(s => [
    s.authorId, { id: s.authorId, name: s.author, url: s.authorUrl, count: 0 },
  ]));
  for (const { source } of books) {
    const author = authorsById.get(source.authorId);
    if (author) author.count++;
    else authorsById.set(source.authorId, { id: source.authorId, name: source.author, url: source.authorUrl, count: 1 });
  }
  const authors = [...authorsById.values()].filter(author => author.count);

  return { books: grouped, sources: catalog.sources, authors, ranking: catalog.ranking, allDownload: catalog.allDownload };
}
