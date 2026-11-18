"use client";

import Image from "next/image";
import dynamic from "next/dynamic";
import { Fragment, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { categoryById } from "@/lib/categories";
import { TopicFilters } from "./TopicFilters";
import type { Book, Library } from "@/lib/types";
import { Book3D } from "./Book3D";
import { LibraryIcon } from "./LibraryIcons";
import { bookThickness } from "./Shelf";
import { playSound } from "./sound";
import s from "./ReadingRoom.module.css";

const WalkingRoom = dynamic(() => import("./WalkingRoom"), {
  ssr: false,
  loading: () => (
    <div className={s.loading} role="status">
      Opening the stacks…
    </div>
  ),
});
const perPage = 8;

interface RoomProps {
  library: Library;
  books: Book[];
  category: string;
  author: string;
  walking: boolean;
  paused: boolean;
  onWalk: (walking: boolean) => void;
  onFilter: (patch: { category?: string; author?: string }) => void;
  onOpen: (index: number) => void;
  onDetails: (index: number) => void;
}

export function ReadingRoom({
  library,
  books,
  category,
  author,
  walking,
  paused,
  onWalk,
  onFilter,
  onOpen,
  onDetails,
}: RoomProps) {
  const collection = useRef<HTMLElement>(null);
  const enter = useRef<HTMLButtonElement>(null);
  const [page, setPage] = useState(0);
  const topicCount = new Set(books.map((b) => b.category)).size;
  const last = Math.max(0, Math.ceil(books.length / perPage) - 1);
  const current = Math.min(page, last);
  const start = current * perPage;
  const changePage = (to: number) => {
    setPage(to);
    collection.current?.scrollIntoView({ block: "start" });
  };
  function leave() {
    onWalk(false);
    requestAnimationFrame(() => enter.current?.focus({ preventScroll: true }));
  }
  return (
    <main className={s.home}>
      {walking ? (
        <div className={s.walkFrame}>
          <WalkingRoom
            key={`${category}:${author}`}
            books={books}
            paused={paused}
            onOpen={onOpen}
            onExit={leave}
          />
        </div>
      ) : (
        <section className={s.hero} aria-labelledby="room-title">
          <Image
            src="/reading-room.webp"
            alt="Sunlight crosses the walnut shelves and reading tables of the library."
            fill
            sizes="100vw"
            preload
            className={s.photo}
          />
          <div className={s.shade} />
          <div className={s.intro}>
            <div className={s.eyebrow}>
              <span className={s.rule} /> A library of agent skills
            </div>
            <h1 id="room-title">
              The Reading <em>Room</em>
            </h1>
            <p>
              Walk the stacks, pull a volume from the shelf,
              <br className={s.lineBreak} /> and read the skills inside.
            </p>
            <button
              ref={enter}
              className={s.enter}
              onClick={() => {
                playSound("step");
                onWalk(true);
              }}
            >
              <LibraryIcon name="walk" size={19} /> Enter the library <LibraryIcon name="arrow" size={17} />
            </button>
          </div>
          <div className={s.roomLabel}>
            <LibraryIcon name="compass" size={17} /> 3D walkthrough
          </div>
        </section>
      )}
      <section className={s.collection} aria-labelledby="collection-title" ref={collection}>
        <div className={s.collectionHead}>
          <div>
            <div className={s.indexLine}>
              <span className={s.rule} /> {books.length} volumes · {topicCount}{" "}
              {topicCount === 1 ? "topic" : "topics"}
            </div>
            <h2 id="collection-title">On the shelves</h2>
          </div>
          <TopicFilters
            library={library}
            category={category}
            author={author}
            onFilter={(patch) => {
              setPage(0);
              onFilter(patch);
            }}
          />
        </div>
        <div className={s.grid}>
          {books.slice(start, start + perPage).map((book, offset) => {
            const index = start + offset;
            const startsTopic = offset === 0 || books[index - 1].category !== book.category;
            return (
              <Fragment key={book.id}>
                {startsTopic && <h3 className={s.topicHeading}>{categoryById(book.category)?.label}</h3>}
                <article className={s.card} style={{ "--jacket": book.design.bg } as CSSProperties}>
                  <button
                    className={s.display}
                    onPointerMove={(e) => {
                      if (e.pointerType !== "mouse") return;
                      const r = e.currentTarget.getBoundingClientRect();
                      e.currentTarget.style.setProperty(
                        "--tilt",
                        `${((e.clientX - r.left) / r.width) * 24 - 12}deg`,
                      );
                      e.currentTarget.style.setProperty(
                        "--pitch",
                        `${6 - ((e.clientY - r.top) / r.height) * 12}deg`,
                      );
                    }}
                    aria-label={`Read ${book.design.title}`}
                    onClick={() => onOpen(index)}
                  >
                    <span className={s.volume}>Vol. {String(book.rank).padStart(3, "0")}</span>
                    <span className={s.bookShadow} />
                    <Book3D className={s.object} book={book} w={134} h={201} d={bookThickness(book, 201)} />
                  </button>
                  <button
                    className={s.caption}
                    aria-label={`Details for ${book.design.title}`}
                    onClick={() => onDetails(index)}
                  >
                    <span>
                      <strong>{book.design.title}</strong>
                      <small>{book.source.author}</small>
                    </span>
                    <LibraryIcon name="arrow" size={17} />
                  </button>
                </article>
              </Fragment>
            );
          })}
        </div>
        <div className={s.pagination}>
          <span>
            {start + 1}–{Math.min(start + perPage, books.length)} of {books.length} volumes
          </span>
          <div>
            <button
              disabled={current === 0}
              aria-label="Previous catalogue page"
              onClick={() => changePage(current - 1)}
            >
              <LibraryIcon name="left" />
            </button>
            <button
              disabled={current === last}
              aria-label="Next catalogue page"
              onClick={() => changePage(current + 1)}
            >
              <LibraryIcon name="right" />
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
