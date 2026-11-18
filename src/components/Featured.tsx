"use client";
import { useState } from "react";
import type { CSSProperties } from "react";
import { hashString } from "@/lib/designs";
import type { Book } from "@/lib/types";
import { Book3D } from "./Book3D";
import { bookThickness } from "./Shelf";
import { useElementSize, useStepGestures } from "./useElementSize";
import s from "./Featured.module.css";

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: string, b: string, t: number) => {
  const [x, y] = [hex(a), hex(b)];
  return "#" + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, "0")).join("");
};
const luminance = (h: string) => {
  const [r, g, b] = hex(h).map((v) => v / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** A ridge line from a few seeded sine waves, closed down to the bottom edge. */
function ridge(seed: number, base: number, amp: number) {
  const p = [seed * 0.37, seed * 1.13, seed * 2.71];
  // Overshoot the frame so the brush displacement never pulls an edge into view.
  let d = "M -80 980";
  for (let x = -80; x <= 1680; x += 16) {
    const y = base + amp * (0.55 * Math.sin(x * 0.0035 + p[0]) + 0.3 * Math.sin(x * 0.009 + p[1]) + 0.15 * Math.sin(x * 0.031 + p[2]));
    d += ` L ${x} ${Math.round(y)}`;
  }
  return `${d} L 1680 980 Z`;
}

/** A painted landscape — sky, haze, receding ridges — in the book's palette. */
function Backdrop({ book }: { book: Book }) {
  const d = book.design;
  const id = `bd-${book.id}`;
  const seed = hashString(book.id) % 997;
  const paper = "#f2ede2";
  // Pale covers would vanish into pale hills, so tint the land with the accent instead.
  const land = luminance(d.bg) > 0.55 ? mix(d.accent, d.bg, 0.25) : d.bg;
  const sky = [mix(d.accent, paper, 0.62), mix(land, paper, 0.84), paper];
  const ridges = [
    { base: 520, amp: 90, color: mix(land, paper, 0.7), seed: seed + 1 },
    { base: 610, amp: 70, color: mix(land, paper, 0.48), seed: seed + 2 },
    { base: 700, amp: 55, color: mix(land, paper, 0.26), seed: seed + 3 },
    { base: 810, amp: 40, color: mix(land, "#000000", 0.12), seed: seed + 4 },
  ];
  return (
    <svg className={s.backdrop} preserveAspectRatio="xMidYMid slice" viewBox="0 0 1600 900" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-sky`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={sky[0]} />
          <stop offset="0.6" stopColor={sky[1]} />
          <stop offset="1" stopColor={sky[2]} />
        </linearGradient>
        <radialGradient id={`${id}-sun`} cx="0.7" cy="0.3" r="0.35">
          <stop offset="0" stopColor="#fffaf0" stopOpacity="0.85" />
          <stop offset="1" stopColor="#fffaf0" stopOpacity="0" />
        </radialGradient>
        {/* Clouds: stretched noise turned into soft white alpha. */}
        <filter id={`${id}-clouds`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.0018 0.0065" numOctaves={5} seed={seed} />
          <feColorMatrix type="matrix" values="0 0 0 0 1  0 0 0 0 0.98  0 0 0 0 0.95  2.2 0 0 0 -1.05" />
        </filter>
        {/* Brushwork: roughen the ridge edges and add strata. */}
        <filter id={`${id}-brush`} x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012 0.03" numOctaves={3} seed={seed + 11} result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="26" xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <filter id={`${id}-grain`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.02 0.08" numOctaves={2} seed={seed + 7} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.24  0 0 0 0 0.18  0 0 0 0 0.12  0 0 0 -2 1.25" />
        </filter>
        <linearGradient id={`${id}-cloudfade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="1" />
          <stop offset="0.62" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <mask id={`${id}-cloudmask`}>
          <rect width="1600" height="900" fill={`url(#${id}-cloudfade)`} />
        </mask>
        <radialGradient id={`${id}-vig`} cx="0.5" cy="0.45" r="0.8">
          <stop offset="0.6" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </radialGradient>
      </defs>
      <rect width="1600" height="900" fill={`url(#${id}-sky)`} />
      <rect width="1600" height="900" fill={`url(#${id}-sun)`} />
      <rect width="1600" height="900" filter={`url(#${id}-clouds)`} mask={`url(#${id}-cloudmask)`} opacity="0.9" />
      <g filter={`url(#${id}-brush)`}>
        {ridges.map((r, i) => (
          <path key={i} d={ridge(r.seed, r.base, r.amp)} fill={r.color} />
        ))}
      </g>
      <rect width="1600" height="900" filter={`url(#${id}-grain)`} opacity="0.3" style={{ mixBlendMode: "multiply" }} />
      <rect width="1600" height="900" fill={`url(#${id}-vig)`} />
    </svg>
  );
}

export function Featured({
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
  const go = (dir: 1 | -1) => onSelect((active + dir + books.length) % books.length);
  const { handlers, consumedDrag } = useStepGestures(go);
  // Keep the outgoing backdrop underneath while the new one dissolves in.
  const [layers, setLayers] = useState<number[]>([active]);
  if (layers[layers.length - 1] !== active) setLayers([layers[layers.length - 1], active]);

  const book = books[active];
  const H = Math.round(Math.max(220, Math.min(height * 0.74, width * 0.5, 600)));
  const W = Math.round(H * 0.667);
  const D = bookThickness(book, H);

  return (
    <div ref={ref} className={s.stage} {...handlers}>
      <div className={s.frame}>
        {layers.map((i, n) => (
          <div key={books[i].id} className={`${s.layer} ${n === layers.length - 1 && layers.length > 1 ? s.enter : ""}`}>
            <Backdrop book={books[i]} />
          </div>
        ))}
      </div>
      {width > 0 && (
        <button
          type="button"
          className={s.floater}
          style={{ width: W, height: H } as CSSProperties}
          onClick={() => !consumedDrag.current && onOpen(active)}
          aria-label={`Open ${book.design.title}`}
        >
          <span className={s.shadow} />
          <div key={book.id} className={s.arrive}>
            <div className={s.bob}>
              <Book3D book={book} w={W} h={H} d={D} className={s.book} />
            </div>
          </div>
        </button>
      )}
      <button type="button" className={`${s.nav} ${s.prev}`} onClick={() => go(-1)} aria-label="Previous book">
        [←]
      </button>
      <button type="button" className={`${s.nav} ${s.next}`} onClick={() => go(1)} aria-label="Next book">
        [→]
      </button>
    </div>
  );
}
