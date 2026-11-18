import type { CSSProperties } from "react";
import type { Book } from "@/lib/types";
import { BackCover, Cover, Spine } from "./BookParts";
import s from "./Book3D.module.css";

/** A hardcover as a CSS 3D box. Faces cull with backface-visibility, so only what faces you renders. */
export function Book3D({
  book,
  w,
  h,
  d,
  printedBack,
  className,
  style,
}: {
  book: Book;
  w: number;
  h: number;
  d: number;
  printedBack?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const vars = {
    "--w": `${w}px`,
    "--h": `${h}px`,
    "--d": `${d}px`,
    "--bg": book.design.bg,
    width: w,
    height: h,
    ...style,
  } as CSSProperties;
  return (
    <div className={`${s.book} ${className ?? ""}`} style={vars}>
      <div className={`${s.face} ${s.front}`}>
        <Cover book={book} />
      </div>
      <div className={`${s.face} ${s.back}`}>{printedBack && <BackCover book={book} />}</div>
      <div className={`${s.face} ${s.spine}`}>
        <Spine book={book} />
      </div>
      <div className={`${s.face} ${s.pages}`} />
      <div className={`${s.face} ${s.top}`} />
      <div className={`${s.face} ${s.bottom}`} />
    </div>
  );
}
