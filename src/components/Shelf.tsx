"use client";
import { Fragment, type CSSProperties } from "react";
import { categoryById } from "@/lib/categories";
import type { Book } from "@/lib/types";
import { Book3D } from "./Book3D";
import { useElementSize, useStepGestures } from "./useElementSize";
import s from "./Shelf.module.css";

export function bookThickness(book: Book, h: number) {
  const t = Math.min(1, Math.max(0, (book.words - 300) / 5000));
  return Math.round(h * (0.075 + 0.12 * t));
}

export function Shelf({
  books,
  active,
  onSelect,
  onOpen,
}: {
  books: Book[];
  active: number;
  onSelect: (i: number) => void;
  onOpen: (i: number) => void;
}) {
  const [ref, { width, height }] = useElementSize<HTMLDivElement>();
  const { handlers, consumedDrag } = useStepGestures((dir) =>
    onSelect(Math.min(books.length - 1, Math.max(0, active + dir))),
  );

  const H = Math.round(Math.max(200, Math.min(height * 0.72, width * (width < 700 ? 0.9 : 0.55), 500)));
  const W = Math.round(H * 0.667);
  const gap = Math.max(3, Math.round(H * 0.012));
  const activeGap = Math.round(H * 0.07);

  const dividerWidth = Math.max(22, Math.round(H * 0.065));
  let x = 0;
  const slots = [];
  for (const [i, b] of books.entries()) {
    const d = bookThickness(b, H);
    const isActive = i === active;
    const w = isActive ? W : d;
    const startsTopic = i === 0 || books[i - 1].category !== b.category;
    const divider = startsTopic ? x : null;
    if (startsTopic) x += dividerWidth + gap * 2;
    if (isActive) x += activeGap;
    const left = x;
    x += w + gap + (isActive ? activeGap : 0);
    slots.push({ b, d, w, left, isActive, divider });
  }
  const a = slots[active];
  const offset = width / 2 - (a.left + a.w / 2);
  const top = Math.round((height - H) * 0.4);

  return (
    <div
      ref={ref}
      className={s.stage}
      {...handlers}
      style={{ perspectiveOrigin: `50% ${top + H * 0.2}px` } as CSSProperties}
    >
      <h2 className={s.topicTitle}>{categoryById(a.b.category)?.label}</h2>
      <div className={s.row}>
        {width > 0 &&
          slots.map(({ b, d, w, left, isActive, divider }, i) => {
            const z = isActive ? -d / 2 + H * 0.06 : -W / 2;
            return (
              <Fragment key={b.id}>
                {divider !== null && (
                  <span
                    className={s.divider}
                    aria-hidden="true"
                    style={{
                      transform: `translateX(${Math.round(offset + divider)}px)`,
                      width: dividerWidth,
                      height: H * 0.88,
                      top: top + H * 0.12,
                    }}
                  >
                    {categoryById(b.category)?.label}
                  </span>
                )}
                <button
                  type="button"
                  className={`${s.slot} ${isActive ? s.active : ""}`}
                  style={
                    {
                      "--x": `${Math.round(offset + left)}px`,
                      top,
                      width: w,
                      height: H,
                    } as CSSProperties
                  }
                  aria-label={isActive ? `Open ${b.design.title}` : `${b.design.title}, number ${b.rank}`}
                  aria-current={isActive || undefined}
                  onClick={() => {
                    if (consumedDrag.current) return;
                    if (isActive) onOpen(i);
                    else onSelect(i);
                  }}
                >
                  <span className={s.shadow} style={{ width: w + (isActive ? 8 : 4) }} />
                  <Book3D
                    book={b}
                    w={W}
                    h={H}
                    d={d}
                    className={s.book}
                    style={
                      {
                        marginLeft: -W / 2,
                        transform: `translateZ(${z}px) rotateY(${isActive ? 0 : 90}deg)`,
                      } as CSSProperties
                    }
                  />
                </button>
              </Fragment>
            );
          })}
      </div>
      <div className={s.floor} style={{ top: top + H }} />
    </div>
  );
}
