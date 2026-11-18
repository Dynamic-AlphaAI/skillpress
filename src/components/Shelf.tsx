"use client";
import type { CSSProperties } from "react";
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

  let x = 0;
  const slots = books.map((b, i) => {
    const d = bookThickness(b, H);
    const isActive = i === active;
    const w = isActive ? W : d;
    if (isActive) x += activeGap;
    const left = x;
    x += w + gap + (isActive ? activeGap : 0);
    return { b, d, w, left, isActive };
  });
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
      <div className={s.row}>
      {width > 0 &&
        slots.map(({ b, d, w, left, isActive }, i) => {
          const z = isActive ? -d / 2 + H * 0.06 : -W / 2;
          return (
            <button
              key={b.id}
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
          );
        })}
      </div>
      <div className={s.floor} style={{ top: top + H }} />
    </div>
  );
}
