"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { categories } from "@/lib/categories";
import { formatBytes } from "@/lib/install";
import type { Library } from "@/lib/types";
import { Details } from "./Details";
import { Featured } from "./Featured";
import { Reader } from "./Reader";
import { Shelf } from "./Shelf";
import { TitleMarquee } from "./TitleMarquee";
import { replaceSearch, useSearch } from "./useUrlState";
import s from "./Press.module.css";

type View = "catalogue" | "featured";
type Panel = false | "info" | "install";

/** Everything on screen, as it is spelled in the URL. */
interface PressState {
  category: string;
  author: string;
  /** Id of the book on the shelf; null means the middle of the shelf. */
  book: string | null;
  view: View;
  reading: boolean;
  details: Panel;
  /** Body page to open the reader at. */
  page?: number;
}

const shelfFor = (library: Library, category: string, author: string) =>
  library.books.filter(
    (b) => (category === "all" || b.category === category) && (author === "all" || b.source.authorId === author),
  );

/** With nothing chosen, the shelf opens on its middle book so the library sits centred. */
const middleOf = <T,>(list: T[]) => list[Math.floor((list.length - 1) / 2)];

function parseState(search: string, library: Library): PressState {
  const q = new URLSearchParams(search);
  let category = categories.some((c) => c.id === q.get("category")) ? q.get("category")! : "all";
  const author = library.authors.some((a) => a.id === q.get("author")) ? q.get("author")! : "all";
  if (!shelfFor(library, category, author).length) category = "all";
  const id = q.get("book");
  const reading = q.has("read");
  return {
    category,
    author,
    book: shelfFor(library, category, author).some((b) => b.id === id) ? id : null,
    view: q.get("view") === "featured" ? "featured" : "catalogue",
    reading,
    details: reading ? false : q.has("install") ? "install" : q.has("details") ? "info" : false,
    page: Number(q.get("page")) || undefined,
  };
}

function serializeState(st: PressState, library: Library) {
  const q = new URLSearchParams();
  if (st.category !== "all") q.set("category", st.category);
  if (st.author !== "all") q.set("author", st.author);
  const fallback = middleOf(shelfFor(library, st.category, st.author))?.id;
  if (st.book && (st.book !== fallback || st.reading || st.details)) q.set("book", st.book);
  if (st.view === "featured") q.set("view", "featured");
  if (st.reading) {
    q.set("read", "");
    if (st.page) q.set("page", String(st.page));
  } else if (st.details === "install") q.set("install", "");
  else if (st.details) q.set("details", "");
  return q;
}

export function Press({ library }: { library: Library }) {
  const { books } = library;
  const search = useSearch();
  const state = useMemo(() => parseState(search, library), [search, library]);
  const { category, author, view, reading, details } = state;

  // Every change goes through the URL, so reloads and shared links land in place.
  const update = useCallback(
    (patch: Partial<PressState>) => {
      const current = parseState(window.location.search, library);
      replaceSearch(serializeState({ ...current, ...patch }, library));
    },
    [library],
  );

  const filterBar = useRef<HTMLDivElement>(null);
  // Keep the chosen filters visible when the row scrolls (narrow screens).
  useEffect(() => {
    filterBar.current
      ?.querySelectorAll('[aria-selected="true"]')
      .forEach((el) => el.scrollIntoView({ block: "nearest", inline: "nearest" }));
  }, [category, author]);

  const visible = useMemo(() => shelfFor(library, category, author), [library, category, author]);
  const found = visible.findIndex((b) => b.id === state.book);
  const active = found >= 0 ? found : Math.floor((visible.length - 1) / 2);
  const book = visible[active];

  const select = useCallback(
    (i: number) => update({ book: visible[Math.max(0, Math.min(visible.length - 1, i))].id }),
    [visible, update],
  );
  /** Change one filter (dropping the other if the shelf would be empty) and re-centre the shelf. */
  const filter = (patch: { category?: string; author?: string }) => {
    let next = { category, author, ...patch };
    if (!shelfFor(library, next.category, next.author).length) next = { ...next, ...(patch.category ? { author: "all" } : { category: "all" }) };
    update({ ...next, book: null });
  };
  const open = useCallback(
    (i: number) => update({ book: visible[i].id, details: false, reading: true, page: undefined }),
    [visible, update],
  );
  const closeReader = useCallback(() => update({ reading: false, page: undefined }), [update]);
  const installFromReader = useCallback(() => update({ reading: false, page: undefined, details: "install" }), [update]);
  const closeDetails = useCallback(() => update({ details: false }), [update]);

  useEffect(() => {
    if (reading || details) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      if (e.key === "ArrowRight") select(active + 1);
      else if (e.key === "ArrowLeft") select(active - 1);
      else if (e.key === "Enter" && !(e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)) open(active);
      else if (key === "i") update({ details: "info" });
      else if (key === "g") update({ details: "install" });
      else if (key === "f") update({ view: view === "featured" ? "catalogue" : "featured" });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, reading, details, view, select, open, update]);

  // Counts for each facet reflect the other facet's choice.
  const categoryCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of shelfFor(library, "all", author)) c[b.category] = (c[b.category] ?? 0) + 1;
    return c;
  }, [library, author]);
  const authorCounts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of shelfFor(library, category, "all")) c[b.source.authorId] = (c[b.source.authorId] ?? 0) + 1;
    return c;
  }, [library, category]);

  // "Download all" follows the author filter when that author has a single library.
  const authorSources = library.sources.filter((src) => src.authorId === author);
  const bundle =
    authorSources.length === 1
      ? { href: authorSources[0].download.zip, bytes: authorSources[0].download.bytes, label: `all ${authorSources[0].author}` }
      : { href: library.allDownload.zip, bytes: library.allDownload.bytes, label: `all ${books.length} skills` };

  return (
    <div className={s.page}>
      <header className={s.masthead}>
        <Link
          className={s.brand}
          href="/"
          onClick={(e) => {
            e.preventDefault();
            update({ category: "all", author: "all", book: null, reading: false, details: false, page: undefined });
          }}
        >
          Skill Press
        </Link>
        <nav className={s.meta}>
          <div className={s.tabs} role="tablist" aria-label="View">
            <button type="button" role="tab" aria-selected={view === "catalogue"} onClick={() => update({ view: "catalogue" })}>
              Shelf
            </button>
            <span aria-hidden="true">/</span>
            <button type="button" role="tab" aria-selected={view === "featured"} onClick={() => update({ view: "featured" })}>
              Featured
            </button>
          </div>
          <a href={bundle.href} download title={`One .zip (${formatBytes(bundle.bytes)})`}>
            [ ↓ <span className={s.hideSm}>Download {bundle.label}</span>
            <span className={s.showSm}>All</span> ]
          </a>
        </nav>
      </header>

      <div className={s.subbar}>
        <div ref={filterBar} className={s.filters}>
          <div className={s.group} role="tablist" aria-label="Subject">
            {[{ id: "all", label: "All skills", short: "All" }, ...categories].map((c) => {
              const n = c.id === "all" ? shelfFor(library, "all", author).length : (categoryCounts[c.id] ?? 0);
              return (
                <button
                  key={c.id}
                  type="button"
                  role="tab"
                  aria-selected={category === c.id}
                  className={n === 0 ? s.empty : undefined}
                  onClick={() => filter({ category: c.id })}
                >
                  <span className={s.longLabel}>{c.label}</span>
                  <span className={s.shortLabel}>{c.short}</span> <span className={s.count}>{n}</span>
                </button>
              );
            })}
          </div>
          <div className={s.group} role="tablist" aria-label="Author">
            <span className={s.groupLabel} aria-hidden="true">
              By
            </span>
            {[{ id: "all", name: "Everyone" }, ...library.authors].map((a) => {
              const n = a.id === "all" ? shelfFor(library, category, "all").length : (authorCounts[a.id] ?? 0);
              return (
                <button
                  key={a.id}
                  type="button"
                  role="tab"
                  aria-selected={author === a.id}
                  className={n === 0 ? s.empty : undefined}
                  onClick={() => filter({ author: a.id })}
                >
                  {a.name} <span className={s.count}>{n}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <TitleMarquee books={visible} active={active} onSelect={select} />

      <main className={s.stage}>
        {view === "catalogue" ? (
          <Shelf key={`${category}:${author}`} books={visible} active={active} onSelect={select} onOpen={open} />
        ) : (
          <Featured books={visible} active={active} onSelect={select} onOpen={open} />
        )}
      </main>

      <footer className={s.bar}>
        <button type="button" className={`${s.current} ${s.hideXs}`} onClick={() => update({ details: "info" })}>
          [+] {book.design.title}
          <span className={s.hideSm}> — {book.source.author}</span>
        </button>
        <span className={`${s.hint} ${s.hideSm}`}>← → browse · ↵ open · g get · i details · f featured</span>
        <div className={s.actions}>
          <button type="button" onClick={() => open(active)}>
            Open book [+]
          </button>
          <span className={s.sep} aria-hidden="true">
            |
          </span>
          <button type="button" className={s.get} onClick={() => update({ details: "install" })}>
            Get skill [↓]
          </button>
          <span className={s.sep} aria-hidden="true">
            |
          </span>
          <button type="button" onClick={() => update({ details: "info" })}>
            Details [+]
          </button>
        </div>
      </footer>

      {details && (
        <Details book={book} library={library} focus={details} onClose={closeDetails} onOpen={() => open(active)} />
      )}
      {reading && (
        <Reader
          key={book.id}
          book={book}
          library={library}
          onClose={closeReader}
          onInstall={installFromReader}
          startPage={state.page}
        />
      )}
    </div>
  );
}
