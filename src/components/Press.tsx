"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { resolveCategory } from "@/lib/categories";
import { TopicFilters } from "./TopicFilters";
import { formatBytes } from "@/lib/install";
import type { Library } from "@/lib/types";
import { LibraryIcon } from "./LibraryIcons";
import { ReadingRoom } from "./ReadingRoom";
import { playSound, toggleSound, useSound } from "./sound";
import { Details } from "./Details";
import { Featured } from "./Featured";

import { Shelf } from "./Shelf";
import { TitleMarquee } from "./TitleMarquee";
import { writeSearch, useSearch } from "./useUrlState";
import s from "./Press.module.css";

const CatalogueSearch = dynamic(() => import("./CatalogueSearch"));
const Reader = dynamic(() => import("./Reader").then((mod) => mod.Reader));

type View = "library" | "catalogue" | "featured" | "search";
type Panel = false | "info" | "install";

/** Everything on screen, as it is spelled in the URL. */
interface PressState {
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

const shelfFor = (library: Library, category: string, author: string) =>
  library.books.filter(
    (b) => (category === "all" || b.category === category) && (author === "all" || b.source.authorId === author),
  );

/** With nothing chosen, the shelf opens on its middle book so the library sits centred. */
const middleOf = <T,>(list: T[]) => list[Math.floor((list.length - 1) / 2)];

function parseState(search: string, library: Library): PressState {
  const q = new URLSearchParams(search);
  const id = q.get("book");
  let category = resolveCategory(q.get("category"), library.books.find((b) => b.id === id)?.category);
  const author = library.authors.some((a) => a.id === q.get("author")) ? q.get("author")! : "all";
  if (!shelfFor(library, category, author).length) category = "all";
  const reading = q.has("read");
  const legacyShelfLink = ["book", "category", "author", "read", "install", "details"].some((key) => q.has(key));
  return {
    category,
    author,
    query: (q.get("q") ?? "").slice(0, 200),
    book: shelfFor(library, category, author).some((b) => b.id === id) ? id : null,
    view: q.get("view") === "search" || (!q.has("view") && q.has("q")) ? "search"
      : q.get("view") === "featured" ? "featured"
      : q.get("view") === "shelf" || q.get("view") === "catalogue" ? "catalogue"
      : q.get("view") === "library" || q.has("walk") || !legacyShelfLink ? "library" : "catalogue",
    walking: q.has("walk"),
    reading,
    details: reading ? false : q.has("install") ? "install" : q.has("details") ? "info" : false,
    page: Number(q.get("page")) || undefined,
  };
}

function serializeState(st: PressState, library: Library) {
  const q = new URLSearchParams();
  if (st.category !== "all") q.set("category", st.category);
  if (st.author !== "all") q.set("author", st.author);
  if (st.book && (st.reading || st.details || st.book !== middleOf(shelfFor(library, st.category, st.author))?.id)) q.set("book", st.book);
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

export function Press({ library }: { library: Library }) {
  const { books } = library;
  const soundOn = useSound();
  const search = useSearch();
  const state = useMemo(() => parseState(search, library), [search, library]);
  const { category, author, view, reading, details, walking } = state;

  // Every change goes through the URL, so reloads and shared links land in place.
  const update = useCallback(
    (patch: Partial<PressState>, push = false) => {
      const current = parseState(window.location.search, library);
      writeSearch(serializeState({ ...current, ...patch }, library), {
        push, fromResults: current.view === "search" && patch.reading === true,
      });
    },
    [library],
  );

  const lastControl = useRef<HTMLElement | null>(null);
  const hadOverlay = useRef(false);
  useEffect(() => {
    if (reading || details) hadOverlay.current = true;
    else if (hadOverlay.current) {
      hadOverlay.current = false;
      if (lastControl.current?.isConnected) lastControl.current.focus({ preventScroll: true });
    }
  }, [reading, details]);

  const visible = useMemo(() => shelfFor(library, category, author), [library, category, author]);
  const found = visible.findIndex((b) => b.id === state.book);
  const active = found >= 0 ? found : Math.floor((visible.length - 1) / 2);
  const book = visible[active];

  const select = useCallback(
    (i: number) => {
      playSound("book");
      update({ book: visible[Math.max(0, Math.min(visible.length - 1, i))].id });
    },
    [visible, update],
  );
  /** Change one filter (dropping the other if the shelf would be empty) and re-centre the shelf. */
  const filter = (patch: { category?: string; author?: string }) => {
    let next = { category, author, ...patch };
    if (!shelfFor(library, next.category, next.author).length) next = { ...next, ...(patch.category ? { author: "all" } : { category: "all" }) };
    update({ ...next, book: null });
  };
  const open = useCallback(
    (i: number) => {
      playSound("book");
      update({ book: visible[i].id, details: false, reading: true, page: undefined });
    },
    [visible, update],
  );
  const closeOverlay = useCallback(() => {
    if (window.history.state?.skillPressFromResults) window.history.back();
    else update({ reading: false, details: false, page: undefined });
  }, [update]);
  const installFromReader = useCallback(() => update({ reading: false, page: undefined, details: "install" }), [update]);

  useEffect(() => {
    if (reading || details) return;
    const onKey = (e: KeyboardEvent) => {
      if (view === "library" || view === "search" || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.metaKey || e.ctrlKey || e.altKey) return;
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

  // "Download all" follows the author filter when that author has a single library.
  const authorSources = library.sources.filter((src) => src.authorId === author);
  const bundle =
    authorSources.length === 1
      ? { href: authorSources[0].download.zip, bytes: authorSources[0].download.bytes, label: `all ${authorSources[0].author}` }
      : { href: library.allDownload.zip, bytes: library.allDownload.bytes, label: `all ${books.length} skills` };

  return (
    <div className={`${s.page} ${view === "library" || view === "search" ? s.libraryPage : ""}`}>
      <div className={s.surface} inert={!!(reading || details)} onFocusCapture={(e) => { lastControl.current = e.target; }}>
      <header className={s.masthead}>
        <Link className={s.brand} href="/" onClick={(e) => {
          e.preventDefault();
          update({ view: "library", walking: false, category: "all", author: "all", book: null, reading: false, details: false, page: undefined });
        }}><LibraryIcon name="books" size={29} /> Skill Press</Link>
        <nav className={s.viewNav} aria-label="Browse views">
          {(["library", "catalogue", "featured", "search"] as const).map((mode) =>
            <button key={mode} aria-current={view === mode ? "page" : undefined}
              onClick={() => {
                if (mode === "search" && view === "search") document.getElementById("skill-search")?.focus();
                else update({ view: mode, walking: false, query: "" }, mode === "search" || view === "search");
              }}>
              {mode === "search" && <LibraryIcon name="search" size={15} />}
              {mode === "library" ? "Library" : mode === "catalogue" ? "Shelf" : mode === "featured" ? "Featured" : "Search"}
            </button>)}
        </nav>
        <div className={s.tools}>
          <button className={s.sound} onClick={toggleSound} aria-pressed={soundOn} aria-label={soundOn ? "Mute sound" : "Enable sound"}>
            <LibraryIcon name={soundOn ? "sound" : "mute"} size={16} /><span>Sound {soundOn ? "on" : "off"}</span>
          </button>
          <a className={s.download} href={bundle.href} download aria-label={`Download ${bundle.label}`} title={`Download ${bundle.label} (${formatBytes(bundle.bytes)})`}>
            <span aria-hidden="true">↓</span> <span>Download</span>
          </a>
        </div>
      </header>
      {view === "search" ? (
        <CatalogueSearch library={library} query={state.query} author={author} category={category} onFilter={filter}
          onQuery={(query) => update({ query, book: null })}
          hrefFor={(id) => `/?${serializeState({ ...state, book: id, reading: true, page: undefined }, library)}`}
          onOpen={(id) => {
            playSound("book");
            update({ book: id, reading: true, details: false, page: undefined }, true);
          }}
        />
      ) : view === "library" ? <ReadingRoom library={library} books={visible} author={author} category={category}
        walking={walking} paused={!!(reading || details)}
        onWalk={(value) => update({ walking: value })} onFilter={filter} onOpen={open}
        onDetails={(i) => update({ book: visible[i].id, details: "info" })} /> : <>
      <div className={s.subbar}>
        <TopicFilters library={library} category={category} author={author} onFilter={filter} />
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
      </>}
      </div>

      {details && (
        <Details book={book} library={library} focus={details} onClose={closeOverlay} onOpen={() => open(active)} />
      )}
      {reading && (
        <Reader
          key={book.id}
          book={book}
          library={library}
          onClose={closeOverlay}
          onInstall={installFromReader}
          startPage={state.page}
        />
      )}
    </div>
  );
}
