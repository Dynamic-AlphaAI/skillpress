import type { Library } from "./types";
import { resolveCategory } from "./categories.ts";
import { resolvePlatform, scopeLibrary, type Collection } from "./platforms.ts";

type View = "library" | "catalogue" | "featured" | "search";
type Panel = false | "info" | "install";

/** Everything on screen, as it is spelled in the URL. */
export interface PressState {
  platform: Collection;
  category: string;
  author: string;
  query: string;
  /** Id of the book on the shelf; null means the middle of the shelf. */
  book: string | null;
  view: View;
  walking: boolean;
  reading: boolean;
  details: Panel;
  /** Body page to open the reader at. */
  page?: number;
}

export const shelfFor = (library: Library, category: string, author: string) =>
  library.books.filter(
    (b) => (category === "all" || b.category === category) && (author === "all" || b.source.authorId === author),
  );

/** With nothing chosen, the shelf opens on its middle book so the library sits centred. */
const middleOf = <T,>(list: T[]) => list[Math.floor((list.length - 1) / 2)];

export function parseState(search: string, full: Library): PressState {
  const q = new URLSearchParams(search);
  const platform = resolvePlatform(q.get("platform"));
  const library = scopeLibrary(full, platform);
  const id = q.get("book");
  let category = resolveCategory(q.get("category"), library.books.find((b) => b.id === id)?.category);
  const author = library.authors.some((a) => a.id === q.get("author")) ? q.get("author")! : "all";
  if (!shelfFor(library, category, author).length) category = "all";
  const book = shelfFor(library, category, author).find(b => b.id === id)?.id ?? null;
  const canOpen = !id || !!book;
  const reading = canOpen && q.has("read");
  const legacyShelfLink = ["book", "category", "author", "read", "install", "details"].some((key) => q.has(key));
  return {
    platform,
    category,
    author,
    query: (q.get("q") ?? "").slice(0, 200),
    book,
    view: q.get("view") === "search" || (!q.has("view") && q.has("q")) ? "search"
      : q.get("view") === "featured" ? "featured"
      : q.get("view") === "shelf" || q.get("view") === "catalogue" ? "catalogue"
      : q.get("view") === "library" || q.has("walk") || !legacyShelfLink ? "library" : "catalogue",
    walking: q.has("walk"),
    reading,
    details: reading || !canOpen ? false : q.has("install") ? "install" : q.has("details") ? "info" : false,
    page: Number(q.get("page")) || undefined,
  };
}

export function serializeState(st: PressState, full: Library) {
  const q = new URLSearchParams();
  if (st.platform !== "all") q.set("platform", st.platform);
  if (st.category !== "all") q.set("category", st.category);
  if (st.author !== "all") q.set("author", st.author);
  if (st.book && (st.reading || st.details || st.book !== middleOf(shelfFor(scopeLibrary(full, st.platform), st.category, st.author))?.id)) q.set("book", st.book);
  if (st.view === "search") {
    if (st.query) q.set("q", st.query);
    else q.set("view", "search");
  } else if (st.view === "featured") q.set("view", "featured");
  else if (st.view === "catalogue") q.set("view", "shelf");
  else if (q.size || st.reading || st.details) q.set("view", "library");
  if (st.view === "library" && st.walking) q.set("walk", "");
  if (st.reading) {
    q.set("read", "");
    if (st.page) q.set("page", String(st.page));
  } else if (st.details === "install") q.set("install", "");
  else if (st.details) q.set("details", "");
  return q;
}
