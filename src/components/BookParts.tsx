import type { CSSProperties } from "react";
import type { Book } from "@/lib/types";
import { CoverArt, SpineArt } from "./CoverArt";
import s from "./BookParts.module.css";

export function PressMark({ color, on, className }: { color: string; on: string; className?: string }) {
  return (
    <span className={`${s.mark} ${className ?? ""}`} style={{ background: color, color: on }} aria-hidden="true">
      §
    </span>
  );
}

const vars = (b: Book) =>
  ({ "--bg": b.design.bg, "--ink": b.design.ink, "--accent": b.design.accent }) as CSSProperties;

export function Cover({ book, className }: { book: Book; className?: string }) {
  const d = book.design;
  const labelled = d.motif === "marble";
  return (
    <div className={`${s.cover} ${className ?? ""}`} style={vars(book)}>
      <CoverArt slug={book.id} design={d} />
      {(d.kicker || d.series) && (
        <div className={s.seriesLabel}>{d.kicker ?? (d.volume ? `${d.series} · ${d.volume} of ${d.volumes}` : d.series)}</div>
      )}
      <div className={`${s.titleBlock} ${d.titleAt === "top" ? s.top : s.bottom} ${labelled ? s.labelled : ""}`}>
        <div className={s.author}>{book.source.author}</div>
        <div className={s.rule} />
        <div className={s.title}>{d.title}</div>
        <div className={s.subtitle}>{d.subtitle}</div>
      </div>
      <PressMark color={d.ink} on={d.bg} className={s.coverMark} />
    </div>
  );
}

export function Spine({ book }: { book: Book }) {
  const d = book.design;
  return (
    <div className={s.spine} style={vars(book)}>
      {d.patternedSpine && <SpineArt slug={book.id} design={d} />}
      {d.series && <span className={s.spineBand} aria-hidden="true" />}
      <div className={`${s.spineInner} ${d.patternedSpine ? s.spineLabelled : ""}`}>
        <span className={s.spineNo}>{String(book.rank).padStart(2, "0")}</span>
        {/* Long titles step down in size so they fit the spine instead of being cut off. */}
        <span className={s.spineTitle} style={{ "--fit": Math.min(1, 21 / d.title.length) } as CSSProperties}>
          {d.title}
        </span>
        <span className={s.spineAuthor}>{book.source.author}</span>
        <PressMark color={d.ink} on={d.bg} className={s.spineMark} />
      </div>
    </div>
  );
}

export function BackCover({ book }: { book: Book }) {
  const d = book.design;
  return (
    <div className={s.back} style={vars(book)}>
      <p className={s.blurb}>{book.description}</p>
      <div className={s.backFoot}>
        <PressMark color={d.ink} on={d.bg} />
        <span>Skill Press · No. {String(book.rank).padStart(2, "0")}</span>
        <span>{book.installs !== null ? `${book.installs.toLocaleString("en-US")} installs` : "New to the shelf"}</span>
      </div>
    </div>
  );
}
