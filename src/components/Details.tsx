"use client";
import { useEffect, useRef, useState } from "react";
import { platformLabel } from "@/lib/platforms";
import { categoryById } from "@/lib/categories";
import { formatBytes, installMethods } from "@/lib/install";
import type { Book, Library } from "@/lib/types";
import { Book3D } from "./Book3D";
import { bookThickness } from "./Shelf";
import { playSound } from "./sound";
import s from "./Details.module.css";

const TAB_KEY = "skillpress:install-tab";

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Clipboard API can be unavailable (permissions, insecure context): fall back to a selection copy.
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.setAttribute("readonly", "");
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand("copy");
    ta.remove();
    return ok;
  }
}

function CopyBlock({ text, label, kind }: { text: string; label: string; kind: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const preRef = useRef<HTMLPreElement>(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const prompt = kind === "Prompt";
  return (
    <div className={`${s.copyBlock} ${prompt ? s.copyPrompt : ""}`}>
      <div className={s.copyHead}>
        <span>{kind}</span>
        <button
        type="button"
        className={s.copyBtn}
        onClick={async () => {
          const ok = await copyText(text);
          setState(ok ? "copied" : "failed");
          // If the browser refused, leave the text selected so ⌘C / Ctrl+C finishes the job.
          if (!ok && preRef.current) window.getSelection()?.selectAllChildren(preRef.current);
          clearTimeout(timer.current);
          timer.current = setTimeout(() => setState("idle"), 1800);
        }}
      >
        {state === "copied" ? "Copied ✓" : state === "failed" ? "Press ⌘C" : prompt ? "Copy prompt" : "Copy"}
        </button>
      </div>
      <pre ref={preRef} tabIndex={0} aria-label={label}>
        {text}
      </pre>
      <span className={s.srOnly} aria-live="polite">
        {state === "copied" ? "Copied to clipboard" : ""}
      </span>
    </div>
  );
}

function InspectBook({ book }: { book: Book }) {
  const [degrees, setDegrees] = useState(18);
  const drag = useRef<{ x: number; degrees: number } | null>(null);
  const moved = useRef(false);
  return <button type="button" className={s.inspect} aria-label={`Rotate ${book.design.title}`}
    onPointerDown={(e) => {
      if (e.button !== 0) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, degrees }; moved.current = false;
    }}
    onPointerMove={(e) => {
      if (!drag.current) return;
      const dx = e.clientX - drag.current.x;
      if (Math.abs(dx) > 3) moved.current = true;
      if (moved.current) setDegrees(drag.current.degrees + dx * 1.65);
    }}
    onPointerCancel={() => { drag.current = null; }}
    onPointerUp={() => { drag.current = null; }}
    onClick={(e) => {
      if (!moved.current || e.detail === 0) { setDegrees((angle) => angle + 90); playSound("book"); }
      moved.current = false;
    }}>
    <Book3D book={book} w={113} h={170} d={bookThickness(book,170)} printedBack
      style={{ transform: `rotateX(-5deg) rotateY(${degrees}deg)` }} />
    <span aria-hidden="true">↻ Turn book</span>
  </button>;
}

function GetSkill({ book }: { book: Book }) {
  const methods = installMethods(book);
  const [tab, setTab] = useState(methods[0].id);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      // Restoring a per-viewer preference after hydration; the server can't know it.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (saved && methods.some((m) => m.id === saved)) setTab(saved);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const choose = (id: string) => {
    setTab(id);
    try {
      localStorage.setItem(TAB_KEY, id);
    } catch {}
  };
  const current = methods.find((m) => m.id === tab) ?? methods[0];

  return (
    <>
      <div className={s.downloads}>
        <a className={s.primary} href={book.download.zip} download>
          <span>Download .zip ↓</span>
          <small>
            {formatBytes(book.download.bytes)} · {book.download.files} {book.download.files === 1 ? "file" : "files"}
          </small>
        </a>
        <a className={s.secondary} href={book.download.skillMd} download={`${book.id}-SKILL.md`}>
          <span>SKILL.md only</span>
          <small>the instructions</small>
        </a>
      </div>
      <p className={s.hint}>
        The ZIP includes the publisher’s <span className={s.mono}>{book.slug}/</span> skill folder and license.
        {book.source.bundleNote && <> {book.source.bundleNote}</>}
      </p>

      <div className={s.tabs} role="tablist" aria-label="Install method">
        {methods.map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            id={`tab-${m.id}`}
            aria-selected={m.id === current.id}
            aria-controls="install-panel"
            onClick={() => choose(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>
      <div className={s.tabPanel} role="tabpanel" id="install-panel" aria-labelledby={`tab-${current.id}`}>
        <p className={s.note}>{current.note}</p>
        {current.copy && <CopyBlock text={current.copy} label={`${current.label} instructions`} kind={current.kind ?? "Copy"} />}
        {current.steps && (
          <ol className={s.steps}>
            {current.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        )}
        {current.link && (
          <a className={s.more} href={current.link.href} target="_blank" rel="noopener noreferrer">
            {current.link.label} ↗
          </a>
        )}
      </div>
    </>
  );
}

export function Details({
  book,
  library,
  focus,
  onClose,
  onOpen,
}: {
  book: Book;
  library: Library;
  focus: "info" | "install";
  onClose: () => void;
  onOpen: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  const getRef = useRef<HTMLElement>(null);
  useEffect(() => {
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || e.defaultPrevented) return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (focus !== "install" || !getRef.current || !panelRef.current) return;
    const panel = panelRef.current;
    panel.scrollTo({ top: getRef.current.offsetTop - 64, behavior: "smooth" });
  }, [focus, book.id]);

  const d = book.design;
  const category = categoryById(book.category);
  const stats: [string, string][] = [
    ["Rank", `No. ${book.rank} of ${library.books.length}`],
    ["Installs", book.installs !== null ? book.installs.toLocaleString("en-US") : "Not listed yet"],
    ...(book.source.primaryPlatform ? [["Built for", platformLabel(book.source.primaryPlatform)] as [string, string]] : []),
    ...(book.platforms.length ? [["Runs in", book.platforms.map(platformLabel).join(", ")] as [string, string]] : []),
    ...(book.covers.length ? [["Covers", book.covers.map(platformLabel).join(", ")] as [string, string]] : []),
    ["Length", `${book.words.toLocaleString("en-US")} words`],
    ["Reading time", `${book.readingMinutes} min`],
    ["Files", String(book.download.files)],
    ["License", book.license],
  ];

  return (
    <div className={s.scrim} onClick={onClose}>
      <aside
        ref={panelRef}
        tabIndex={-1}
        className={s.panel}
        role="dialog"
        aria-modal="true"
        aria-label={`${d.title}, details`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={s.bar}>
          <span>[ {category?.label ?? "Details"} ]</span>
          <button type="button" onClick={onClose}>
            Close [×]
          </button>
        </div>
        <div className={s.hero}>
          <InspectBook key={book.id} book={book} />
          <div className={s.heroText}>
            <div className={s.kicker}>
              No. {String(book.rank).padStart(2, "0")} · <span className={s.mono}>{book.skillName}</span>
            </div>
            <h2 className={s.title}>{d.title}</h2>
            <p className={s.subtitle}>{d.subtitle}</p>
            <p className={s.author}>{book.source.author}</p>
          </div>
        </div>

        <section ref={getRef} className={`${s.section} ${s.get} ${focus === "install" ? s.flash : ""}`} key={`${book.id}-${focus}`}>
          <h3>Get this skill</h3>
          <GetSkill key={book.id} book={book} />
        </section>

        <section className={s.section}>
          <h3>When to use it</h3>
          <p className={s.desc}>{book.description}</p>
        </section>

        <dl className={s.stats}>
          {stats.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>

        {book.headings.length > 0 && (
          <section className={s.section}>
            <h3>Contents</h3>
            <ol className={s.toc}>
              {book.headings.map((h) => (
                <li key={h.id} className={h.level === 1 ? s.part : undefined}>
                  {h.text}
                </li>
              ))}
            </ol>
          </section>
        )}

        <div className={s.actions}>
          <button type="button" className={s.primaryBtn} onClick={onOpen}>
            Open book [+]
          </button>
          <a className={s.secondaryBtn} href={book.sourceUrl} target="_blank" rel="noopener noreferrer">
            Source on GitHub ↗
          </a>
        </div>
        <p className={s.fine}>
          From <a href={book.source.url} target="_blank" rel="noopener noreferrer">{book.source.repo}</a> at{" "}
          <span className={s.mono}>{book.source.commit.slice(0, 7)}</span>. Install counts from{" "}
          <a href={library.ranking.source} target="_blank" rel="noopener noreferrer">skills.sh</a>. Download{" "}
          <a href={book.source.download.zip} download>
            all editions from {book.source.repo} ({formatBytes(book.source.download.bytes)})
          </a>{" "}
          or{" "}
          <a href={library.allDownload.zip} download>
            all {library.books.length} on the shelf ({formatBytes(library.allDownload.bytes)})
          </a>
          .
        </p>
      </aside>
    </div>
  );
}
