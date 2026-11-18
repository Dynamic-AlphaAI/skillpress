"use client";
import { memo, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { categoryById } from "@/lib/categories";
import type { Book, Heading, Library } from "@/lib/types";
import { BackCover, Cover, PressMark } from "./BookParts";
import { LibraryIcon } from "./LibraryIcons";
import { playSound, toggleSound, useSound } from "./sound";
import { replaceSearch } from "./useUrlState";
import s from "./Reader.module.css";

/* Logical page geometry (px). The whole book is scaled to fit, so pagination never changes with the window. */
const PW = 440;
const PH = 660;
const TW = 352;
const GAP = 48;
const PITCH = TW + GAP;
const FLIP_MS = 900;
/** Contents entries per page: the first page also carries the heading. */
const TOC_FIRST = 15;
const TOC_NEXT = 19;

type Side =
  | { kind: "cover" }
  | { kind: "insideFront" }
  | { kind: "title" }
  | { kind: "copyright" }
  | { kind: "contents"; part: number; entries: Heading[] }
  | { kind: "epigraph" }
  | { kind: "body"; page: number }
  | { kind: "colophon" }
  | { kind: "blank" }
  | { kind: "insideBack" }
  | { kind: "back" };

interface Layout {
  pages: number;
  anchorPage: Record<string, number>;
  sectionFor: string[];
}

interface Flip {
  dir: 1 | -1;
  from: number;
  to: number;
}

/** Endpapers and blanks read as a pause in a spread, but as dead air one page at a time. */
const skipWhenSingle = new Set<Side["kind"]>(["insideFront", "insideBack", "blank"]);

/** Front matter, sized to the contents; the body always opens on a right-hand page. */
function frontMatter(headings: Heading[]) {
  const sides: Side[] = [{ kind: "cover" }, { kind: "insideFront" }, { kind: "title" }, { kind: "copyright" }];
  let rest = headings;
  let part = 0;
  do {
    const take = part === 0 ? TOC_FIRST : TOC_NEXT;
    sides.push({ kind: "contents", part, entries: rest.slice(0, take) });
    rest = rest.slice(take);
    part++;
  } while (rest.length);
  sides.push({ kind: "epigraph" });
  if (sides.length % 2 === 1) sides.push({ kind: "blank" });
  return sides;
}

function buildSides(front: Side[], pages: number): Side[] {
  const sides = [...front];
  for (let p = 0; p < pages; p++) sides.push({ kind: "body", page: p });
  sides.push({ kind: "colophon" });
  if (sides.length % 2 === 1) sides.push({ kind: "blank" });
  sides.push({ kind: "insideBack" }, { kind: "back" });
  return sides;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

function sideLabel(side: Side | undefined): string | null {
  if (!side) return null;
  switch (side.kind) {
    case "body":
      return String(side.page + 1);
    case "cover":
      return "Cover";
    case "back":
      return "Back cover";
    case "title":
      return "Title";
    case "contents":
      return "Contents";
    case "copyright":
      return "Copyright";
    case "epigraph":
      return "Epigraph";
    case "colophon":
      return "Colophon";
    default:
      return null;
  }
}

/* ---------------------------------------------------------------- pages */

const BodyText = memo(function BodyText({ html, page }: { html: { __html: string }; page: number }) {
  return (
    <div className={s.textbox}>
      <div className={s.flow} style={{ transform: `translateX(${-page * PITCH}px)` }} dangerouslySetInnerHTML={html} />
    </div>
  );
});

interface PageCtx {
  book: Book;
  library: Library;
  layout: Layout;
  html: { __html: string };
  jumpToAnchor: (id: string) => void;
  onInstall: () => void;
}

function licenseLine(license: string, holder: string) {
  if (license === "Apache-2.0") return `Text © ${holder}. Licensed under the Apache License, Version 2.0.`;
  if (license === "MIT") return `Text © ${holder}. Licensed under the MIT License.`;
  if (license === "MPL-2.0") return `Text © ${holder}. Licensed under the Mozilla Public License 2.0.`;
  if (license === "GPL-2.0-or-later") return `Text © ${holder}. Licensed under the GNU General Public License, version 2 or later.`;
  if (license === "Unspecified")
    return `Text © ${holder}. This skill ships without its own license file; see the source repository for terms.`;
  return `Text © ${holder}. See the license in the source repository for terms.`;
}

function SideView({ side, index, ctx }: { side: Side; index: number; ctx: PageCtx }) {
  const { book, library, layout } = ctx;
  const d = book.design;
  const verso = index % 2 === 1;
  const paper = `${s.page} ${verso ? s.verso : s.recto}`;
  switch (side.kind) {
    case "cover":
      return (
        <div className={s.hard}>
          <Cover book={book} />
        </div>
      );
    case "back":
      return (
        <div className={s.hard}>
          <BackCover book={book} />
        </div>
      );
    case "insideFront":
    case "insideBack":
      return <div className={s.endpaper} style={{ "--bg": d.bg, "--ink": d.ink } as CSSProperties} />;
    case "blank":
      return <div className={paper} />;
    case "title":
      return (
        <div className={`${paper} ${s.titlePage}`}>
          <PressMark color="var(--page-accent)" on="#f7f2e7" className={s.titleMark} />
          <div>
            <h1 className={s.titleH}>{d.title}</h1>
            <p className={s.titleSub}>{d.subtitle}</p>
          </div>
          <div className={s.titleAuthor}>{book.source.author}</div>
          <div className={s.imprint}>
            <span>Skill Press</span>
            {d.series ? (
              <span>
                {d.series}
                {d.volume ? ` · Vol. ${d.volume}` : ""}
              </span>
            ) : (
              <span>No. {String(book.rank).padStart(2, "0")}</span>
            )}
          </div>
        </div>
      );
    case "copyright":
      return (
        <div className={`${paper} ${s.copyright}`}>
          <p>
            <strong>{d.title}</strong>
            <br />
            {d.subtitle}
          </p>
          <p>{licenseLine(book.license, book.source.copyright)}</p>
          <p>
            Reproduced from <em>{book.source.repo}</em>,{" "}
            <span className={s.mono}>
              {book.sourcePath}/SKILL.md
            </span>
            , at commit <span className={s.mono}>{book.source.commit.slice(0, 7)}</span> ({fmtDate(book.source.commitDate)}).
          </p>
          <p>
            Skill name: <span className={s.mono}>{book.skillName}</span>
            <br />
            Shelved under {categoryById(book.category)?.label ?? "Skills"}.
            <br />
            {book.installs !== null ? (
              <>
                Ranked No.&nbsp;{book.rank} of {library.books.length} by installs on skills.sh —{" "}
                {book.installs.toLocaleString("en-US")} at the time of printing.
              </>
            ) : (
              <>Not yet listed on skills.sh at the time of printing.</>
            )}
          </p>
          <p>
            This edition contains the skill’s instructions only. Scripts, reference files, and assets that ship with the skill
            remain in the source repository.
          </p>
          <p className={s.mono}>Skill Press · {fmtDate(library.ranking.fetchedAt)}</p>
        </div>
      );
    case "contents":
      return (
        <div className={`${paper} ${s.contents} ${side.part > 0 ? s.contentsMore : ""}`}>
          {side.part === 0 ? <div className={s.contentsH}>Contents</div> : <div className={s.epiLabel}>Contents, continued</div>}
          <ol>
            {side.entries.map((h) => (
              <li key={h.id} className={h.level === 1 ? s.part : undefined}>
                <button type="button" onClick={() => ctx.jumpToAnchor(h.id)}>
                  <span className={s.tocText}>{h.text}</span>
                  <span className={s.leader} />
                  <span className={s.tocNum}>{(layout.anchorPage[h.id] ?? 0) + 1}</span>
                </button>
              </li>
            ))}
          </ol>
          {book.headings.length === 0 && <p className={s.muted}>A single, continuous text.</p>}
        </div>
      );
    case "epigraph":
      return (
        <div className={`${paper} ${s.epigraph}`}>
          <div className={s.epiLabel}>When to use this skill</div>
          <blockquote className={book.description.length > 1100 ? s.epiTiny : book.description.length > 650 ? s.epiSmall : undefined}>
            {book.description}
          </blockquote>
          <div className={s.epiCite}>— from the skill’s description</div>
        </div>
      );
    case "colophon":
      return (
        <div className={`${paper} ${s.colophon}`}>
          <div className={s.orn}>⁂</div>
          <div className={s.epiLabel}>About this edition</div>
          <p>
            {book.words.toLocaleString("en-US")} words across {layout.pages} pages, set in Newsreader, Instrument Serif, and IBM
            Plex Mono. The cover art was generated for this edition.
          </p>
          <p>
            <a href={book.sourceUrl} target="_blank" rel="noopener noreferrer">
              Read the source on GitHub ↗
            </a>
          </p>
          <div className={s.colophonInstall}>
            <div className={s.epiLabel}>Install this skill</div>
            <code>
              npx skills add {book.sourceUrl}
              <br />
              --skill {book.skillName}
            </code>
            <button type="button" onClick={ctx.onInstall}>
              More ways to install, and downloads →
            </button>
          </div>
        </div>
      );
    case "body": {
      const p = side.page;
      return (
        <div className={`${paper} ${s.bodyPage}`}>
          <div className={s.runhead}>{verso ? d.title : (layout.sectionFor[p] ?? d.title)}</div>
          <BodyText html={ctx.html} page={p} />
          <div className={s.folio}>{p + 1}</div>
        </div>
      );
    }
  }
}

function SideAt({ i, sides, ctx, book }: { i: number | undefined; sides: Side[]; ctx: PageCtx | null; book: Book }) {
  if (i === undefined || i < 0 || i >= sides.length) return null;
  const side = sides[i];
  if (side.kind === "cover")
    return (
      <div className={s.hard}>
        <Cover book={book} />
      </div>
    );
  return ctx ? <SideView side={side} index={i} ctx={ctx} /> : null;
}

/* ---------------------------------------------------------------- reader */

interface ReaderProps {
  book: Book;
  library: Library;
  onClose: () => void;
  onInstall: () => void;
  startPage?: number;
}

export function Reader(props: ReaderProps) {
  const [body, setBody] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(`/editions/${encodeURIComponent(props.book.id)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Edition unavailable");
        const edition = await response.json();
        if (!controller.signal.aborted) setBody(edition.html);
      } catch {
        if (!controller.signal.aborted) setFailed(true);
      }
    }
    void load();
    return () => controller.abort();
  }, [props.book.id, attempt]);
  const { onClose } = props;
  useEffect(() => {
    if (body !== null) return;
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", escape);
    return () => window.removeEventListener("keydown", escape);
  }, [body, onClose]);
  if (body !== null) return <TypesetReader {...props} body={body} />;
  return <div className={s.overlay} role="dialog" aria-modal="true" aria-label={`${props.book.design.title}, reader`}>
    <header className={s.top}><button autoFocus className={s.uiBtn} onClick={onClose}>← Close</button></header>
    <div className={s.loading} role="status"><strong>{props.book.design.title}</strong>
      {failed ? <><span>This edition couldn’t be loaded.</span><button onClick={() => { setFailed(false); setAttempt(attempt + 1); }}>Try again</button></>
      : <span>Opening book…</span>}
    </div>
  </div>;
}

function TypesetReader({ book, library, onClose, onInstall, startPage, body }: ReaderProps & { body: string }) {
  const soundOn = useSound();
  const measureRef = useRef<HTMLDivElement>(null);
  const leafRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [viewport, setViewport] = useState({ w: 1200, h: 800 });
  const [side, setSide] = useState(0);
  const [flip, setFlip] = useState<Flip | null>(null);
  const html = useMemo(() => ({ __html: body }), [body]);

  const front = useMemo(() => frontMatter(book.headings), [book.headings]);
  const bodyStart = front.length;
  const sides = useMemo(() => (layout ? buildSides(front, layout.pages) : [{ kind: "cover" } as Side]), [layout, front]);
  const total = sides.length;
  const K = total / 2;
  const mode: "spread" | "single" = viewport.w >= 860 ? "spread" : "single";

  /* --- measure pagination once fonts are in --- */
  useEffect(() => {
    let cancelled = false;
    const measure = () => {
      const el = measureRef.current;
      if (!el || cancelled) return;
      const base = el.getBoundingClientRect().left;
      let right = 0;
      for (const child of Array.from(el.children)) right = Math.max(right, child.getBoundingClientRect().right - base);
      const pages = Math.max(1, Math.round((el.scrollWidth + GAP) / PITCH), Math.ceil((right + GAP / 2) / PITCH));
      const anchorPage: Record<string, number> = {};
      el.querySelectorAll<HTMLElement>("[id]").forEach((h) => {
        anchorPage[h.id] = Math.max(0, Math.floor((h.getBoundingClientRect().left - base + 4) / PITCH));
      });
      const marks = book.headings.map((h) => ({ text: h.text, page: anchorPage[h.id] ?? 0 }));
      const sectionFor = Array.from({ length: pages }, (_, p) => {
        let current = "";
        for (const m of marks) if (m.page <= p) current = m.text;
        return current;
      });
      setLayout({ pages, anchorPage, sectionFor });
    };
    document.fonts.ready.then(measure);
    document.fonts.addEventListener?.("loadingdone", measure);
    return () => {
      cancelled = true;
      document.fonts.removeEventListener?.("loadingdone", measure);
    };
  }, [book]);

  /* --- viewport --- */
  useEffect(() => {
    const update = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  /* --- navigation --- */
  const sideRef = useRef(side);
  const flipRef = useRef<Flip | null>(null);
  const queued = useRef<1 | -1 | null>(null);
  const anims = useRef<Animation[]>([]);
  useLayoutEffect(() => {
    sideRef.current = side;
    flipRef.current = flip;
  });

  const spreadOf = (i: number) => Math.floor((i + 1) / 2);
  const targetOf = useCallback(
    (dir: 1 | -1, from: number): number | null => {
      if (!layout) return null;
      if (mode === "spread") {
        const k = spreadOf(from) + dir;
        return k < 0 || k > K ? null : Math.min(2 * k, total - 1);
      }
      let i = from + dir;
      while (i > 0 && i < total - 1 && skipWhenSingle.has(sides[i].kind)) i += dir;
      return i < 0 || i >= total ? null : i;
    },
    [layout, mode, K, total, sides],
  );
  const canStep = useCallback((dir: 1 | -1, from: number) => targetOf(dir, from) !== null, [targetOf]);

  const step = useCallback(
    (dir: 1 | -1) => {
      if (flipRef.current) {
        queued.current = dir;
        anims.current.forEach((a) => a.updatePlaybackRate(2.6));
        return;
      }
      const from = sideRef.current;
      const to = targetOf(dir, from);
      if (to === null) return;
      playSound("paper");
      setFlip({ dir, from, to });
    },
    [targetOf],
  );

  const jump = useCallback((to: number) => {
    anims.current.forEach((a) => a.cancel());
    anims.current = [];
    queued.current = null;
    setFlip(null);
    setSide(Math.max(0, Math.min(to, total - 1)));
  }, [total]);

  const jumpToAnchor = useCallback(
    (id: string) => {
      if (!layout) return;
      const page = layout.anchorPage[id];
      if (page !== undefined) jump(bodyStart + page);
    },
    [layout, jump, bodyStart],
  );

  // Run the page-turn animation for the leaf that the current `flip` mounted.
  useLayoutEffect(() => {
    if (!flip || !leafRef.current) return;
    const leaf = leafRef.current;
    const target = flip.to;
    // Hidden tabs don't advance animation clocks, so land the turn straight away.
    if (document.hidden) {
      queueMicrotask(() => {
        setSide(Math.max(0, target));
        setFlip(null);
      });
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const duration = reduce ? 1 : mode === "single" ? FLIP_MS * 0.75 : FLIP_MS;
    const [a0, a1] = flip.dir === 1 ? [0, -180] : [-180, 0];
    const easing = "cubic-bezier(0.4, 0.08, 0.22, 1)";
    const turn = leaf.animate(
      [
        { transform: `perspective(2600px) rotateY(${a0}deg)` },
        { transform: `perspective(2600px) rotateY(${(a0 + a1) / 2}deg) translateZ(18px)`, offset: 0.5 },
        { transform: `perspective(2600px) rotateY(${a1}deg)` },
      ],
      { duration, easing, fill: "forwards" },
    );
    const shades = Array.from(leaf.querySelectorAll<HTMLElement>("[data-shade]")).map((el) => {
      const front = el.dataset.shade === "front";
      const frames = front === (flip.dir === 1) ? [{ opacity: 0 }, { opacity: 0.45 }] : [{ opacity: 0.45 }, { opacity: 0 }];
      return el.animate(frames, { duration, easing, fill: "forwards" });
    });
    const fade =
      mode === "single"
        ? leaf.animate(
            flip.dir === 1 ? [{ opacity: 1 }, { opacity: 1, offset: 0.45 }, { opacity: 0 }] : [{ opacity: 0 }, { opacity: 1, offset: 0.55 }, { opacity: 1 }],
            { duration, easing, fill: "forwards" },
          )
        : null;
    anims.current = [turn, ...shades, ...(fade ? [fade] : [])];
    turn.onfinish = () => {
      anims.current = [];
      setSide(Math.max(0, target));
      setFlip(null);
    };
    const started = anims.current;
    return () => {
      // If this effect re-runs mid-turn (resize, re-measure) the turn restarts cleanly.
      turn.onfinish = null;
      started.forEach((a) => a.cancel());
    };
  }, [flip, mode, total]);

  // Chain a queued turn once the previous one lands.
  useEffect(() => {
    if (!flip && queued.current) {
      const dir = queued.current;
      queued.current = null;
      step(dir);
    }
  }, [flip, step]);

  // Once paginated: go to the requested page, or open the cover.
  const opened = useRef(false);
  useEffect(() => {
    if (!layout || opened.current) return;
    opened.current = true;
    if (startPage && startPage >= 1 && startPage <= layout.pages) {
      const t = setTimeout(() => jump(bodyStart + startPage - 1), 0);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => step(1), 420);
    return () => clearTimeout(t);
  }, [layout, step, jump, startPage, bodyStart]);

  // Keep ?page= in the address bar so a page can be linked to.
  useEffect(() => {
    if (!layout || flip) return;
    const current = sides[side];
    const q = new URLSearchParams(window.location.search);
    if (current?.kind === "body") q.set("page", String(current.page + 1));
    else q.delete("page");
    replaceSearch(q, false);
  }, [side, flip, layout, sides]);

  /* --- keyboard --- */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.target instanceof HTMLInputElement || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " && e.target instanceof HTMLElement && e.target.closest("button, a")) return;
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Home") jump(0);
      else if (e.key === "End") jump(total - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [step, jump, onClose, total]);

  /* --- swipe --- */
  const swipe = useRef<{ x: number; y: number } | null>(null);
  const swiped = useRef(false);
  const onPointerDown = (e: React.PointerEvent) => {
    swipe.current = { x: e.clientX, y: e.clientY };
    swiped.current = false;
  };
  const onPointerUp = (e: React.PointerEvent) => {
    const st = swipe.current;
    swipe.current = null;
    if (!st) return;
    const dx = e.clientX - st.x;
    const dy = e.clientY - st.y;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.4) {
      swiped.current = true;
      step(dx < 0 ? 1 : -1);
    }
  };

  const onPageClick = (e: React.MouseEvent, dir: 1 | -1) => {
    if (swiped.current) return;
    const target = e.target as HTMLElement;
    const link = target.closest("a");
    if (link?.dataset.internal) {
      e.preventDefault();
      jumpToAnchor(decodeURIComponent(link.getAttribute("href")!.slice(1)));
      return;
    }
    if (link || target.closest("button")) return;
    step(dir);
  };

  /* --- what is visible --- */
  const ctx: PageCtx | null = layout ? { book, library, layout, html, jumpToAnchor, onInstall } : null;
  const at = (i: number | undefined): ReactNode => <SideAt i={i} sides={sides} ctx={ctx} book={book} />;

  let left: number | undefined;
  let right: number | undefined;
  let leafFront: number | undefined;
  let leafBack: number | undefined;
  let single: number | undefined;
  let targetSpread = spreadOf(side);

  if (mode === "spread") {
    const k = spreadOf(flip ? flip.from : side);
    if (!flip) {
      left = 2 * k - 1;
      right = 2 * k;
      // Idle, the leaf sits hidden over the right page holding the next turn, so turning forward costs no layout.
      leafFront = 2 * k;
      leafBack = 2 * k + 1;
    } else if (flip.dir === 1) {
      left = 2 * k - 1;
      right = 2 * k + 2;
      leafFront = 2 * k;
      leafBack = 2 * k + 1;
      targetSpread = k + 1;
    } else {
      left = 2 * k - 3;
      right = 2 * k;
      leafFront = 2 * k - 2;
      leafBack = 2 * k - 1;
      targetSpread = k - 1;
    }
  } else if (!flip) {
    single = side;
    leafFront = side;
  } else if (flip.dir === 1) {
    single = flip.to;
    leafFront = flip.from;
  } else {
    single = flip.from;
    leafFront = flip.to;
  }

  const bookW = mode === "spread" ? PW * 2 : PW;
  const scale =
    mode === "spread"
      ? Math.min((viewport.w - 96) / (bookW + 40), (viewport.h - 168) / (PH + 40))
      : Math.min((viewport.w - 28) / (PW + 16), (viewport.h - 150) / (PH + 16));
  const closedFront = mode === "spread" && targetSpread === 0;
  const closedBack = mode === "spread" && targetSpread === K && !!layout;
  const shift = closedFront ? -PW / 2 : closedBack ? PW / 2 : 0;

  // Page-edge thickness on either side, by how much has been read.
  const progress = layout ? Math.min(1, side / (total - 1)) : 0;
  const leftEdge = Math.round(1 + progress * 5);
  const rightEdge = Math.round(1 + (1 - progress) * 5);
  const edges = (n: number, dir: 1 | -1) =>
    Array.from({ length: n }, (_, i) => `${dir * (i + 1)}px ${i % 2 ? 1 : 0}px 0 ${i % 2 ? "#d9d2c3" : "#efe9dc"}`).join(", ");

  const visibleLabels =
    mode === "spread"
      ? [sideLabel(sides[2 * spreadOf(side) - 1]), sideLabel(sides[2 * spreadOf(side)])].filter(Boolean)
      : [sideLabel(sides[side])].filter(Boolean);
  const bodyVisible = visibleLabels.length > 0 && visibleLabels.every((l) => /^\d+$/.test(l as string));
  const indicator = layout
    ? bodyVisible
      ? `${visibleLabels.length === 2 ? "pp." : "p."} ${visibleLabels.join("–")} / ${layout.pages}`
      : visibleLabels.join(" · ") || "Endpapers"
    : "Typesetting…";

  const sliderMax = mode === "spread" ? K : total - 1;
  const sliderValue = mode === "spread" ? spreadOf(side) : side;

  const isHard = (i: number | undefined) => i !== undefined && ["cover", "back"].includes(sides[i]?.kind);

  return (
    <div
      className={s.overlay}
      role="dialog"
      aria-modal="true"
      aria-label={`${book.design.title}, reader`}
      style={{ "--page-accent": pageAccent(book), "--bg": book.design.bg } as CSSProperties}
    >
      <header className={s.top}>
        <button type="button" autoFocus className={s.uiBtn} onClick={onClose}>
          ← Close <span className={s.key}>esc</span>
        </button>
        <div className={s.heading}>
          <span className={s.headingTitle}>{book.design.title}</span>
          <span className={s.headingSub}>{book.design.subtitle}</span>
        </div>
        <div className={s.topRight}>
          <button type="button" className={s.uiBtn} aria-label={soundOn ? "Mute sound" : "Enable sound"} aria-pressed={soundOn} onClick={toggleSound}>
            <LibraryIcon name={soundOn ? "sound" : "mute"} size={16} />
          </button>
          <button type="button" className={s.getBtn} onClick={onInstall}>
            Get skill ↓
          </button>
          <span className={s.indicator} aria-live="polite">
            {indicator}
          </span>
        </div>
      </header>

      <div className={s.stage} onPointerDown={onPointerDown} onPointerUp={onPointerUp}>
        <div className={s.fit} style={{ width: bookW * scale, height: PH * scale }}>
          <div className={s.book} style={{ width: bookW, height: PH, transform: `scale(${scale})` }}>
            <div className={s.spread} style={{ transform: `translateX(${shift}px)` }}>
              {mode === "spread" ? (
                <>
                  <div className={`${s.board} ${!closedFront && !closedBack ? s.boardOn : ""}`} />
                  <div
                    className={`${s.slot} ${s.slotLeft} ${isHard(left) ? s.hardSlot : ""}`}
                    style={left !== undefined && left >= 0 && !isHard(left) ? { boxShadow: edges(leftEdge, -1) } : undefined}
                    onClick={(e) => onPageClick(e, -1)}
                  >
                    {at(left)}
                  </div>
                  <div
                    className={`${s.slot} ${s.slotRight} ${isHard(right) ? s.hardSlot : ""}`}
                    style={right !== undefined && right < total && !isHard(right) ? { boxShadow: edges(rightEdge, 1) } : undefined}
                    onClick={(e) => onPageClick(e, 1)}
                  >
                    {at(right)}
                  </div>
                </>
              ) : (
                <div className={`${s.slot} ${s.slotSingle}`} onClick={(e) => {
                  const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                  onPageClick(e, e.clientX - r.left > r.width * 0.4 ? 1 : -1);
                }}>
                  {at(single)}
                </div>
              )}
              {layout && (
                <div
                  ref={leafRef}
                  aria-hidden={!flip}
                  className={`${s.leaf} ${mode === "spread" ? s.leafSpread : s.leafSingle} ${flip ? "" : s.leafIdle}`}
                >
                  <div className={`${s.face} ${s.faceFront}`}>
                    {at(leafFront)}
                    <div className={s.shade} data-shade="front" />
                  </div>
                  <div className={`${s.face} ${s.faceBack}`}>
                    {mode === "spread" ? at(leafBack) : <div className={`${s.page} ${s.verso}`} />}
                    <div className={s.shade} data-shade="back" />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <footer className={s.controls}>
        <button type="button" className={s.uiBtn} onClick={() => step(-1)} disabled={!layout || !canStep(-1, side)}>
          [←] Prev
        </button>
        <input
          className={s.scrubber}
          type="range"
          min={0}
          max={sliderMax}
          value={sliderValue}
          disabled={!layout}
          aria-label="Page"
          onChange={(e) => {
            const v = Number(e.target.value);
            jump(mode === "spread" ? Math.min(2 * v, total - 1) : v);
          }}
        />
        <button type="button" className={s.uiBtn} onClick={() => step(1)} disabled={!layout || !canStep(1, side)}>
          Next [→]
        </button>
      </footer>

      {/* Off-screen copy used only to paginate. */}
      <div ref={measureRef} className={`${s.flow} ${s.measure}`} aria-hidden="true" dangerouslySetInnerHTML={html} />
    </div>
  );
}

function pageAccent(book: Book) {
  const hex = book.design.bg.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  if (lum > 0.55) return book.design.accent;
  if (lum < 0.06) return "#b5602f";
  return book.design.bg;
}
