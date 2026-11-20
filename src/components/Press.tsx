"use client";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { parseState, serializeState, shelfFor, type PressState } from "@/lib/browseState";
import { scopeLibrary, type Collection } from "@/lib/platforms";
import { categories } from "@/lib/categories";
import { TopicFilters } from "./TopicFilters";
import { formatBytes } from "@/lib/install";
import type { Library } from "@/lib/types";
import { LibraryIcon } from "./LibraryIcons";
import { RoomPicker } from "./RoomPicker";
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

export function Press({ library }: { library: Library }) {
  const { books } = library;
  const soundOn = useSound();
  const search = useSearch();
  const state = useMemo(() => parseState(search, library), [search, library]);
  const scoped = useMemo(() => scopeLibrary(library, state.platform), [library, state.platform]);
  const collections = useMemo(() => {
    const counts = new Map<string, number>();
    for (const book of scoped.books) counts.set(book.category, (counts.get(book.category) ?? 0) + 1);
    return [{ id: "all", label: "All topics", count: scoped.books.length },
      ...categories.filter(topic => counts.has(topic.id)).map(topic => ({ ...topic, count: counts.get(topic.id)! }))];
  }, [scoped]);
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

  const collectionLinks = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const strip = collectionLinks.current;
    const active = strip?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!strip) return;
    if (!active) {
      strip.scrollLeft = 0;
      return;
    }
    const bounds = strip.getBoundingClientRect();
    const link = active.getBoundingClientRect();
    if (link.left < bounds.left || link.right > bounds.right) {
      strip.scrollLeft += link.left - bounds.left - (bounds.width - link.width) / 2;
    }
  }, [category, state.platform]);

  const lastControl = useRef<HTMLElement | null>(null);
  const hadOverlay = useRef(false);
  useEffect(() => {
    if (reading || details) hadOverlay.current = true;
    else if (hadOverlay.current) {
      hadOverlay.current = false;
      if (lastControl.current?.isConnected) lastControl.current.focus({ preventScroll: true });
    }
  }, [reading, details]);

  const visible = useMemo(() => shelfFor(scoped, category, author), [scoped, category, author]);
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
    if (!shelfFor(scoped, next.category, next.author).length) next = { ...next, ...(patch.category ? { author: "all" } : { category: "all" }) };
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
      if (view === "library" || view === "search" || e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || (e.target instanceof Element && !!e.target.closest('[role="combobox"], [role="listbox"], [role="option"]')) || e.metaKey || e.ctrlKey || e.altKey) return;
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
      ? { href: authorSources[0].download.zip, bytes: authorSources[0].download.bytes, label: `all skills from ${authorSources[0].repo}` }
      : { href: library.allDownload.zip, bytes: library.allDownload.bytes, label: `all ${books.length} skills` };

  function changePlatform(platform: Collection) {
    const next = scopeLibrary(library, platform);
    const keepAuthor = next.authors.some(a => a.id === author) ? author : "all";
    const keepTopic = shelfFor(next, category, keepAuthor).length ? category : "all";
    update({ platform, author: keepAuthor, category: keepTopic, book: null, reading: false, details: false, page: undefined }, true);
  }
  function topicState(topic: string): PressState {
    return { ...state, category: topic, author: "all", book: null, reading: false, details: false, page: undefined };
  }

  return (
    <div className={`${s.page} ${view === "library" || view === "search" ? s.libraryPage : ""}`}>
      <div className={s.surface} inert={!!(reading || details)} onFocusCapture={(e) => { lastControl.current = e.target; }}>
      <header className={s.masthead}>
        <div className={s.imprint}>
          <span className={s.skillCount} title="Total skills in the library">
            <strong>{books.length.toLocaleString("en-US")}</strong>{" "}
            {books.length === 1 ? "skill" : "skills"}
          </span>
          <Link className={s.brand} href="/" onClick={(e) => {
            e.preventDefault();
            update({ view: "library", walking: false, platform: "all", category: "all", author: "all", book: null, reading: false, details: false, page: undefined });
          }}><LibraryIcon name="books" size={29} /> Skill Press</Link>
        </div>
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
      <nav className={s.collections} aria-label="Topic collections">
        <div className={s.collectionPicker}>
          <RoomPicker label="Topic" accessibleLabel="Browse by topic" value={category} side="bottom"
            options={collections.map(p => ({ value: p.id, label: `${p.label} · ${p.count}` }))}
            onChange={value => update(topicState(value), true)} />
        </div>
        <div className={s.collectionLinks} ref={collectionLinks}>
          {collections.slice(1).map(({ id, label, count }) => {
            const target = topicState(id);
            const query = serializeState(target, library).toString();
            return <a key={id} href={query ? `/?${query}` : "/"}
              aria-current={id === category ? "page" : undefined}
              title={`${label} · ${count} skills`}
              onClick={event => {
                if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || event.button !== 0) return;
                event.preventDefault();
                if (category !== id || author !== "all") update(target, true);
              }}>{label} <small>{count}</small></a>;
          })}
        </div>
      </nav>
      {view === "search" ? (
        <CatalogueSearch platform={state.platform} onPlatform={changePlatform} library={scoped} query={state.query} author={author} category={category} onFilter={filter}
          onClear={() => update({ platform: "all", category: "all", author: "all", book: null }, true)}
          onQuery={(query) => update({ query, book: null })}
          hrefFor={(id) => `/?${serializeState({ ...state, book: id, reading: true, page: undefined }, library)}`}
          onOpen={(id) => {
            playSound("book");
            update({ book: id, reading: true, details: false, page: undefined }, true);
          }}
        />
      ) : view === "library" ? <ReadingRoom platform={state.platform} onPlatform={changePlatform} key={`${state.platform}:${category}:${author}`} library={scoped} books={visible} author={author} category={category}
        walking={walking} paused={!!(reading || details)}
        onWalk={(value) => update({ walking: value })} onFilter={filter} onOpen={open}
        onDetails={(i) => update({ book: visible[i].id, details: "info" })} /> : <>
      <div className={s.subbar}>
        <TopicFilters library={scoped} category={category} author={author} platform={state.platform} onPlatform={changePlatform} onFilter={filter} />
      </div>

      <TitleMarquee books={visible} active={active} onSelect={select} />

      <main className={s.stage}>
        {view === "catalogue" ? (
          <Shelf key={`${state.platform}:${category}:${author}`} books={visible} active={active} onSelect={select} onOpen={open} />
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
