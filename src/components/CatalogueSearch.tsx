"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import MiniSearch from "minisearch";
import { categoryById } from "@/lib/categories";
import { createIndex, findBooks, searchOptions } from "@/lib/search";
import type { Book, Library } from "@/lib/types";
import { Cover } from "./BookParts";
import { LibraryIcon } from "./LibraryIcons";
import { TopicFilters } from "./TopicFilters";
import s from "./CatalogueSearch.module.css";

let fullIndex: Promise<MiniSearch> | undefined;

function loadFullIndex() {
  fullIndex ??= fetch("/search-index")
    .then(async (response) => {
      if (!response.ok) throw new Error("Search index unavailable");
      return MiniSearch.loadJSONAsync(await response.text(), searchOptions);
    })
    .catch((error) => {
      fullIndex = undefined;
      throw error;
    });
  return fullIndex;
}

type BookLink = { hrefFor: (id: string) => string; onOpen: (id: string) => void };

function Results({ books, hrefFor, onOpen }: BookLink & { books: Book[] }) {
  const [limit, setLimit] = useState(16);
  return (
    <>
      <ul className={s.results} aria-label="Matching skills">
        {books.slice(0, limit).map((book) => (
          <li key={book.id}>
            <a href={hrefFor(book.id)} aria-label={`Read ${book.design.title}`} onClick={(event) => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
              event.preventDefault();
              onOpen(book.id);
            }}>
              <div className={s.cover} aria-hidden="true"><Cover book={book} /></div>
              <div className={s.entry}>
                <h2>{book.design.title}</h2>
                <div className={s.credit}>{book.source.author} · {categoryById(book.category)?.label}</div>
                <p>{book.description}</p>
              </div>
              <LibraryIcon name="arrow" size={18} />
            </a>
          </li>
        ))}
      </ul>
      {books.length > limit && <button type="button" className={s.more} onClick={() => setLimit(limit + 16)}>Show more results</button>}
    </>
  );
}

export default function CatalogueSearch({ library, query, author, category, onQuery, onFilter, onOpen, hrefFor }: BookLink & {
  library: Library;
  query: string;
  author: string;
  category: string;
  onQuery: (query: string) => void;
  onFilter: (patch: { category?: string; author?: string }) => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const count = useRef<HTMLParagraphElement>(null);
  const [index, setIndex] = useState<MiniSearch>();
  const [attempt, setAttempt] = useState(0);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let current = true;
    loadFullIndex().then(
      (value) => { if (current) setIndex(value); },
      () => { if (current) setFailed(true); },
    );
    return () => { current = false; };
  }, [attempt]);

  const byId = useMemo(() => new Map(library.books.map((book) => [book.id, book])), [library]);
  const catalogue = useMemo(() => createIndex(library.books), [library]);
  const matches = useMemo(() => findBooks(index ?? catalogue, byId, query), [index, catalogue, byId, query]);
  const results = matches.filter((book) => (author === "all" || book.source.authorId === author) &&
    (category === "all" || book.category === category));
  const filtered = category !== "all" || author !== "all";
  function clear() {
    onQuery("");
    input.current?.focus();
  }
  return (
    <main className={s.page}>
      <div className={s.inner}>
        <h1>Search the library</h1>
        <form role="search" className={s.form} onSubmit={(event) => {
          event.preventDefault();
          count.current?.focus();
        }}>
          <LibraryIcon name="search" size={22} />
          <input id="skill-search" type="search" aria-label="Search skills" placeholder="Search by keyword, title, or author"
            autoFocus ref={input} value={query} onChange={(event) => onQuery(event.target.value)}
            maxLength={200} autoComplete="off" spellCheck={false} enterKeyHint="search" />
          {query && <button type="button" onClick={clear} aria-label="Clear search"><LibraryIcon name="close" /></button>}
        </form>
        <div className={s.filters}>
          <TopicFilters library={library} matches={matches} category={category} author={author} onFilter={onFilter} />
          {filtered && <button type="button" className={s.reset} onClick={() => onFilter({ category: "all", author: "all" })}>Clear filters</button>}
        </div>
        <p role="status" className={s.count} tabIndex={-1} ref={count}>
          {results.length} {query.trim() ? (results.length === 1 ? "result" : "results") : (results.length === 1 ? "skill" : "skills")}
          {query.trim() && !index && !failed && " · Searching book text…"}
        </p>
        {failed && <p className={s.notice}>Searching catalogue details. Book text couldn’t load.{" "}
          <button className={s.reset} type="button" onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>Try again</button>
        </p>}
        {results.length ? (
          <Results key={JSON.stringify([query, category, author])} books={results} hrefFor={hrefFor} onOpen={onOpen} />
        ) : (index || failed) && (
          <div className={s.empty}><h2>No matching skills</h2><p>{filtered ? "Try another keyword or clear your filters." : "Try another keyword, author, or topic."}</p></div>
        )}
      </div>
    </main>
  );
}
