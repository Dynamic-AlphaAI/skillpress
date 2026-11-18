"use client";

import { useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { planShelves } from "@/lib/roomShelves";
import type { Book } from "@/lib/types";
import { createRoom } from "./roomScene";
import { CoverArt } from "./CoverArt";
import { LibraryIcon } from "./LibraryIcons";
import s from "./WalkingRoom.module.css";

export default function WalkingRoom({
  books,
  paused,
  onOpen,
  onExit,
}: {
  books: Book[];
  paused: boolean;
  onOpen: (index: number) => void;
  onExit: () => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const jackets = useRef<HTMLDivElement>(null);
  const scene = useRef<ReturnType<typeof createRoom> | null>(null);
  const [destination, setDestination] = useState(-1);
  const [selection, setSelection] = useState("");
  const [pointed, setPointed] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const shelves = useMemo(() => planShelves(books), [books]);
  const at = destination < shelves.length ? destination : -1;
  const volumes = shelves[at]?.books ?? books;
  const chosen = volumes.find((b) => b.id === selection) ?? volumes[0];
  const openBook = useEffectEvent((id: string) => {
    const index = books.findIndex((b) => b.id === id);
    if (index >= 0) onOpen(index);
  });
  const holdStarted = useRef(0);
  const focusOnEntry = useRef(true);
  useEffect(() => {
    if (!canvas.current) return;
    try {
      const world = createRoom(canvas.current, shelves, jackets.current!, {
        open: openBook,
        hover: setPointed,
        lost: () => setUnavailable(true),
      });
      scene.current = world;
      if (focusOnEntry.current) {
        canvas.current.focus({ preventScroll: true });
        focusOnEntry.current = false;
      }
      return () => {
        scene.current = null;
        world.dispose();
      };
    } catch {
      // Report a synchronous failure to acquire the external WebGL device.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setUnavailable(true);
    }
  }, [shelves]);
  useEffect(() => {
    scene.current?.pause(paused);
  }, [paused, shelves]);
  function go(value: number) {
    setDestination(value);
    setSelection("");
    setPointed("");
    scene.current?.visit(value);
    canvas.current?.focus({ preventScroll: true });
  }
  return (
    <section
      className={s.room}
      aria-label="Walk the library"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !paused) onExit();
      }}
    >
      <div hidden ref={jackets} aria-hidden="true">
        {shelves.flatMap((bay) =>
          bay.books.slice(0, bay.faceOutCount)
            .map((b) => (
              <span key={b.id} data-jacket={b.id}>
                <CoverArt slug={b.id} design={b.design} />
              </span>
            )),
        )}
      </div>
      <div className={s.viewport}>
        <canvas
          ref={canvas}
          tabIndex={0}
          aria-label="Walkable library. Use W A S D to move and left or right arrow to turn. Choose a shelf and volume below to browse by keyboard."
        />
        <div className={s.top}>
          <button onClick={onExit} className={s.exit}>
            ← Leave room
          </button>
          <span>
            <LibraryIcon name="compass" size={16} /> {shelves[at]?.label ?? "Entrance hall"}
          </span>
        </div>
        {unavailable ? (
          <div className={s.fallback}>
            <div>
              <strong>The library catalogue</strong>
              <p>3D rendering is unavailable on this device. Choose a shelf and a volume below to read.</p>
            </div>
          </div>
        ) : (
          <>
            <div className={s.instructions}>
              {pointed ? (
                <strong>{pointed} · Open book</strong>
              ) : (
                <>
                  <span>Drag to look around</span>
                  <span>WASD to walk</span>
                  <span>Click a spine to read</span>
                </>
              )}
            </div>
            <div className={s.pad} aria-label="Movement">
              {(
                [
                  ["arrowleft", "↶", "Turn left"],
                  ["w", "↑", "Walk forward"],
                  ["s", "↓", "Walk backward"],
                  ["arrowright", "↷", "Turn right"],
                ] as const
              ).map(([key, label, title]) => (
                <button
                  key={key}
                  aria-label={title}
                  title={title}
                  onPointerDown={(e) => {
                    holdStarted.current = performance.now();
                    e.currentTarget.setPointerCapture(e.pointerId);
                    scene.current?.setKey(key, true);
                  }}
                  onPointerUp={() => {
                    scene.current?.setKey(key, false);
                    if (performance.now() - holdStarted.current < 100) scene.current?.tap(key);
                  }}
                  onPointerCancel={() => scene.current?.setKey(key, false)}
                  onKeyDown={(e) => {
                    if (e.key === " " || e.key === "Enter") {
                      e.preventDefault();
                      scene.current?.setKey(key, true);
                    }
                  }}
                  onKeyUp={() => scene.current?.setKey(key, false)}
                  onBlur={() => scene.current?.setKey(key, false)}
                >
                  {label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
      <div className={s.desk}>
        <label>
          Shelf
          <select aria-label="Visit a shelf" value={at} onChange={(e) => go(Number(e.target.value))}>
            <option value={-1}>Entrance hall</option>
            {shelves.map((b, i) => (
              <option key={b.label} value={i}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          Volume
          <select
            aria-label="Choose a volume"
            value={chosen?.id ?? ""}
            onChange={(e) => setSelection(e.target.value)}
          >
            {volumes.map((b) => (
              <option key={b.id} value={b.id}>
                {b.design.title}
              </option>
            ))}
          </select>
        </label>
        <button
          onClick={() => {
            if (chosen) onOpen(books.indexOf(chosen));
          }}
        >
          Read book <LibraryIcon name="arrow" size={16} />
        </button>
      </div>
    </section>
  );
}
