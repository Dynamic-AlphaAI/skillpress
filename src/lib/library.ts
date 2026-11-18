import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import MarkdownIt, { type Token } from "markdown-it";
import { categoryFor } from "./categories";
import { designFor } from "./designs";
import type { Book, Heading, Library } from "./types";

const CONTENT = path.join(process.cwd(), "content");

interface Catalog {
  source: Library["source"];
  ranking: Library["ranking"];
  allDownload: Library["allDownload"];
  books: Pick<Book, "slug" | "rank" | "installs" | "license" | "plugin" | "download">[];
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

export function loadLibrary(): Library {
  const catalog: Catalog = JSON.parse(fs.readFileSync(path.join(CONTENT, "catalog.json"), "utf8"));

  const books: Book[] = catalog.books.map((entry) => {
    const file = fs.readFileSync(path.join(CONTENT, "skills", entry.slug, "SKILL.md"), "utf8");
    const { data, content } = matter(file);
    const blobBase = `${catalog.source.url}/blob/${catalog.source.commit}/skills/${entry.slug}/`;
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

    const html = md.renderer.render(tokens, md.options, {});
    const words = content.split(/\s+/).filter(Boolean).length;
    const description = String(data.description ?? "").trim();

    return {
      slug: entry.slug,
      rank: entry.rank,
      installs: entry.installs,
      license: entry.license,
      category: categoryFor(entry.slug, entry.plugin?.name ?? null),
      plugin: entry.plugin,
      download: entry.download,
      skillName: String(data.name ?? entry.slug),
      description,
      originalTitle,
      html,
      headings,
      words,
      readingMinutes: Math.max(1, Math.round(words / 230)),
      sourceUrl: `${catalog.source.url}/tree/${catalog.source.commit}/skills/${entry.slug}`,
      design: designFor(entry.slug, originalTitle ?? undefined),
    };
  });

  return { books, source: catalog.source, ranking: catalog.ranking, allDownload: catalog.allDownload };
}
