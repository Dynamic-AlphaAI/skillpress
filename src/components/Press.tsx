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
  /** Slug of the book on the shelf; null means the first in the category. */
  book: string | null;
  view: View;
  reading: boolean;
  details: Panel;
  /** Body page to open the reader at. */
  page?: number;
}

const shelfFor = (library: Library, category: string) =>
  category === "all" ? library.books : library.books.filter((b) => b.category === category);

function parseState(search: string, library: Library): PressState {
  const q = new URLSearchParams(search);
  const category = categories.some((c) => c.id === q.get("category")) ? q.get("category")! : "all";
  const slug = q.get("book");
  const reading = q.has("read");
  return {
    category,
    book: shelfFor(library, category).some((b) => b.slug === slug) ? slug : null,
    view: q.get("view") === "featured" ? "featured" : "catalogue",
    reading,
    details: reading ? false : q.has("install") ? "install" : q.has("details") ? "info" : false,
    page: Number(q.get("page")) || undefined,
  };
}

function serializeState(st: PressState, library: Library) {
  const q = new URLSearchParams();
  if (st.category !== "all") q.set("category", st.category);
  if (st.book && (st.book !== shelfFor(library, st.category)[0].slug || st.reading || st.details)) q.set("book", st.book);
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
  const { category, view, reading, details } = state;

  // Every change goes through the URL, so reloads and shared links land in place.
  const update = useCallback(
    (patch: Partial<PressState>) => {
      const current = parseState(window.location.search, library);
      replaceSearch(serializeState({ ...current, ...patch }, library));
    },
    [library],
  );

  const categoryBar = useRef<HTMLDivElement>(null);
  // Keep the chosen category visible when the row scrolls (narrow screens).
  useEffect(() => {
    categoryBar.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [category]);

  const visible = useMemo(() => shelfFor(library, category), [library, category]);
  const active = Math.max(0, visible.findIndex((b) => b.slug === state.book));
  const book = visible[active];

  const select = useCallback(
    (i: number) => update({ book: visible[Math.max(0, Math.min(visible.length - 1, i))].slug }),
    [visible, update],
  );
  const chooseCategory = (id: string) => {
    const keep = shelfFor(library, id).some((b) => b.slug === book.slug);
    update({ category: id, book: keep ? book.slug : null });
  };
  const open = useCallback(
    (i: number) => update({ book: visible[i].slug, details: false, reading: true, page: undefined }),
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

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const b of books) c[b.category] = (c[b.category] ?? 0) + 1;
    return c;
  }, [books]);

  return (
    <div className={s.page}>
      <header className={s.masthead}>
        <Link
          className={s.brand}
          href="/"
          onClick={(e) => {
            e.preventDefault();
            update({ category: "all", book: null, reading: false, details: false, page: undefined });
          }}
        >
          Skill Press
        </Link>
        <nav className={s.meta}>
          <a href={library.source.url} target="_blank" rel="noopener noreferrer">
            [ <span className={s.hideSm}>{library.source.repo}</span>
            <span className={s.showSm}>Source</span> ↗ ]
          </a>
          <a href={library.allDownload.zip} download title={`Every skill as one .zip (${formatBytes(library.allDownload.bytes)})`}>
            [ ↓ <span className={s.hideSm}>Download all {books.length} skills</span>
            <span className={s.showSm}>All</span> ]
          </a>
        </nav>
      </header>

      <div className={s.subbar}>
        <div ref={categoryBar} className={s.categories} role="tablist" aria-label="Category">
          {[{ id: "all", label: "All skills", short: "All" }, ...categories].map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={category === c.id}
              onClick={() => chooseCategory(c.id)}
            >
              <span className={s.longLabel}>{c.label}</span>
              <span className={s.shortLabel}>{c.short}</span>{" "}
              <span className={s.count}>{c.id === "all" ? books.length : (counts[c.id] ?? 0)}</span>
            </button>
          ))}
        </div>
        <div className={s.tabs} role="tablist" aria-label="View">
          <button type="button" role="tab" aria-selected={view === "catalogue"} onClick={() => update({ view: "catalogue" })}>
            Shelf
          </button>
          <span aria-hidden="true">/</span>
          <button type="button" role="tab" aria-selected={view === "featured"} onClick={() => update({ view: "featured" })}>
            Featured
          </button>
        </div>
      </div>

      <TitleMarquee books={visible} active={active} onSelect={select} />

      <main className={s.stage}>
        {view === "catalogue" ? (
          <Shelf key={category} books={visible} active={active} onSelect={select} onOpen={open} />
        ) : (
          <Featured books={visible} active={active} onSelect={select} onOpen={open} />
        )}
      </main>

      <footer className={s.bar}>
        <button type="button" className={`${s.current} ${s.hideXs}`} onClick={() => update({ details: "info" })}>
          [+] {book.design.title}
          <span className={s.hideSm}> — No. {String(book.rank).padStart(2, "0")}</span>
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
          key={book.slug}
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
