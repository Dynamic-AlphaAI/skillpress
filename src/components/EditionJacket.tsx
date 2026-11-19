import { categoryById } from "@/lib/categories";
import { hashString } from "@/lib/designs";
import type { Book } from "@/lib/types";
import { JacketIllustration } from "./JacketIllustration";

const serif = "Georgia, 'Times New Roman', serif";
const sans = "Helvetica, Arial, sans-serif";
const mono = "'Courier New', monospace";

// Explicit line lengths keep the printed title identical in the browser and in a 3D texture.
function emWidth(text: string) {
  let width = 0;
  for (const char of text) {
    if (/[ilIjt.,:;'!| ]/.test(char)) width += 0.29;
    else if (/[MWmw@%]/.test(char)) width += 0.88;
    else if (/[A-Z0-9]/.test(char)) width += 0.66;
    else width += 0.52;
  }
  return width;
}

function Lettering({ text, x, y, w, h, size, family = serif, bold = false, center = false, italic = false }: {
  text: string; x: number; y: number; w: number; h: number; size: number;
  family?: string; bold?: boolean; center?: boolean; italic?: boolean;
}) {
  if (!text) return null;
  const words = text.split(/\s+/);
  const factor = bold ? 1.04 : 1;
  let lines: string[];
  let pt = size;
  for (;;) {
    lines = [];
    let line = "";
    for (const word of words) {
      const next = line ? line + " " + word : word;
      if (line && emWidth(next) * pt * factor > w) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    lines.push(line);
    if (pt <= 5 || (lines.length * pt * 1.08 <= h && lines.every(l => emWidth(l) * pt * factor <= w))) break;
    pt -= 0.5;
  }
  return <text fontFamily={family} fontWeight={bold ? 700 : 400} fontStyle={italic ? "italic" : undefined}
    fontSize={pt} textAnchor={center ? "middle" : "start"}>
    {lines.map((line, i) => <tspan key={i} x={center ? x+w/2 : x} y={y + pt * (0.83 + i * 1.08)}
      textLength={Math.min(w, emWidth(line) * pt * factor)} lengthAdjust="spacingAndGlyphs">{line}</tspan>)}
  </text>;
}

/** A complete, standalone print surface, including type, for the shelf, reader and WebGL room. */
export function EditionJacket({ book }: { book: Book }) {
  const d = book.design;
  const jacket = d.jacket!;
  const { layout, spot } = jacket;
  const seed = hashString(book.id);
  const label = d.kicker ?? (d.volume ? `${d.series} · ${d.volume}/${d.volumes}` : categoryById(book.category)?.label ?? "");
  const subtitle = d.series ? d.subtitle : "";
  function art(x: number, y: number, w: number, h: number) {
    return <svg x={x} y={y} width={w} height={h} viewBox="0 0 180 160" preserveAspectRatio="xMidYMid slice" overflow="hidden">
      <rect x="-200" y="-200" width="580" height="560" fill={d.bg} />
      <JacketIllustration design={d} seed={seed} />
      {jacket.plate && <image href={jacket.plate} width="180" height="160" preserveAspectRatio="xMidYMid slice" />}
    </svg>;
  }
  function heading(x: number, y: number, w: number, h: number, size: number, family = serif, bold = false, center = false) {
    return <Lettering text={d.title} {...{x,y,w,h,size,family,bold,center}} />;
  }
  function imprint(y: number, x = 17, w = 206) {
    return <text x={x} y={y} fontFamily={mono} fontSize="8.5"
      textLength={Math.min(w, label.length * 5.1)} lengthAdjust="spacingAndGlyphs">{label.toUpperCase()}</text>;
  }
  function credit(x: number, w: number) {
    return <>
      <Lettering text={subtitle} x={x} y={305} w={w} h={23} size={10} italic />
      <path d={`M${x} 333h${w}`} stroke="currentColor" strokeWidth=".75" />
      <Lettering text={book.source.author} x={x} y={339} w={w} h={13} size={10.5} family={sans} />
    </>;
  }
  let print;
  switch (layout) {
    case "poster":
      print = <>{art(0, 0, 240, 171)}<rect y="171" width="240" height="5" fill={d.accent} />
        {imprint(193)}{heading(16, 203, 208, 97, 38, sans, true)}{credit(17,206)}</>;
      break;
    case "bookplate":
      print = <>{art(0, 0, 240, 360)}
        <rect x="22" y="76" width="196" height="217" fill={d.bg} stroke={d.ink} strokeWidth="1.6" />
        <rect x="27" y="81" width="186" height="207" fill="none" stroke={d.ink} strokeWidth=".65" />
        {imprint(103,36,168)}{heading(37, 127, 166, 111, 32, serif, false, true)}
        <Lettering text={subtitle} x={38} y={243} w={164} h={24} size={9} center italic />
        <Lettering text={book.source.author} x={37} y={271} w={166} h={13} size={10} family={sans} center /></>;
      break;
    case "column":
      print = <>{art(0, 0, 72, 360)}<rect x="72" width="7" height="360" fill={d.accent} />
        {imprint(25,89,141)}<path d="M89 35h139" stroke={d.ink} />
        {heading(88, 67, 140, 216, 36, serif)}{credit(89,139)}</>;
      break;
    case "folio":
      print = <><rect x="10" y="9" width="220" height="342" fill="none" stroke={d.accent} strokeWidth="1.2" />
        {imprint(28,22,196)}{heading(24, 41, 192, 96, 32, serif, false, true)}
        <rect x="29" y="142" width="182" height="151" fill="none" stroke={d.ink} />
        {art(33,146,174,143)}<Lettering text={subtitle} x={23} y={298} w={194} h={25} size={10} center italic />
        <Lettering text={book.source.author} x={24} y={329} w={192} h={14} size={11} center /></>;
      break;
    case "banner":
      print = <>{imprint(20)}{heading(16, 33, 208, 96, 35, sans, true)}
        <rect y="137" width="240" height="5" fill={spot} />{art(0,142,240,subtitle ? 156 : 185)}
        {credit(17,206)}</>;
      break;
    case "diagonal":
      print = <>{imprint(22)}{heading(17, 37, 204, 102, 35, serif)}
        <g transform="rotate(-10 120 212)">{art(-23,155,286,118)}
          <rect x="-23" y="273" width="286" height="5" fill={d.accent} /></g>
        {credit(17,206)}</>;
  }
  return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 360" preserveAspectRatio="xMidYMid meet"
    aria-hidden="true" data-jacket-layout={layout} fill={d.ink} color={d.ink}>
    <rect width="240" height="360" fill={d.bg} />{print}
  </svg>;
}
