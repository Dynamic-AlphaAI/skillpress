"use client";
import { useLayoutEffect, useRef, useState } from "react";
import type { Book } from "@/lib/types";
import { useElementSize } from "./useElementSize";
import s from "./TitleMarquee.module.css";

export function TitleMarquee({ books, active, onSelect }: { books: Book[]; active: number; onSelect: (i: number) => void }) {
  const [wrapRef, { width }] = useElementSize<HTMLDivElement>();
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [shift, setShift] = useState(0);
  const [fontsReady, setFontsReady] = useState(false);

  useLayoutEffect(() => {
    document.fonts?.ready.then(() => setFontsReady(true));
  }, []);

  useLayoutEffect(() => {
    const el = itemRefs.current[active];
    if (!el || !width) return;
    setShift(width / 2 - (el.offsetLeft + el.offsetWidth / 2));
  }, [active, books, width, fontsReady]);

  return (
    <div ref={wrapRef} className={s.wrap}>
      <div className={s.row} style={{ transform: `translateX(${shift}px)` }}>
        {books.map((b, i) => (
          <button
            key={b.id}
            ref={(el) => {
              itemRefs.current[i] = el;
            }}
            type="button"
            className={`${s.item} ${i === active ? s.active : ""}`}
            onClick={() => onSelect(i)}
            tabIndex={-1}
          >
            <span className={s.title}>{b.design.title}</span>
            <sup className={s.tag}>{b.skillName}</sup>
          </button>
        ))}
      </div>
    </div>
  );
}
