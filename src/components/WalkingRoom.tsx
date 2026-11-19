"use client";

import { useCallback, useEffect, useEffectEvent, useMemo, useRef, useState } from "react";
import { planRooms } from "@/lib/roomShelves";
import type { Book } from "@/lib/types";
import { createRoom } from "./roomScene";
import { CoverArt } from "./CoverArt";
import { RoomPicker } from "./RoomPicker";
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
  const [roomIndex, setRoomIndex] = useState(0);
  const [destination, setDestination] = useState(-1);
  const [selection, setSelection] = useState("");
  const [pointed, setPointed] = useState("");
  const [onLadder, setOnLadder] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const rooms = useMemo(() => planRooms(books), [books]);
  const room = rooms[roomIndex] ?? rooms[0];
  const shelf = room?.shelves[destination];
  const volumes = useMemo(() => shelf?.books ?? room?.shelves.flatMap((row) => row.books) ?? [], [shelf, room]);
  const chosen = volumes.find((b) => b.id === selection) ?? volumes[0];
  const roomOptions = useMemo(() => rooms.map((section, i) => ({ value: String(i), label: section.label })), [rooms]);
  const shelfOptions = useMemo(() => [
    { value: "-1", label: "All shelves in this room" },
    ...(room?.shelves.map((row, i) => ({ value: String(i), label: row.upper ? `${row.label} · Upper shelf` : row.label })) ?? []),
  ], [room]);
  const enterRoom = useCallback((index: number) => {
    setRoomIndex(index);
    setDestination(-1);
    setSelection("");
    setPointed("");
  }, []);
  const volumeOptions = useMemo(() => volumes.map((book) => ({
    value: book.id, label: book.design.title,
  })), [volumes]);
  const openBook = useEffectEvent((id: string) => {
    const index = books.findIndex((b) => b.id === id);
    if (index >= 0) onOpen(index);
  });
  const holdStarted = useRef(0);
  const focusOnEntry = useRef(true);
  useEffect(() => {
    if (!canvas.current || !rooms.length) return;
    try {
      const world = createRoom(canvas.current, rooms, jackets.current!, {
        enterRoom,
        ladder: (row) => {
          setOnLadder(row !== null);
          setDestination(row ?? -1);
          setSelection("");
          setPointed("");
        },
        open: openBook,
        hover: setPointed,
        lost: () => {
          setUnavailable(true);
          setOnLadder(false);
        },
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
  }, [rooms, enterRoom]);
  useEffect(() => {
    scene.current?.pause(paused);
  }, [paused, rooms]);
  const go = useCallback((shelf: string) => {
    const value = Number(shelf);
    scene.current?.visit(value);
    setDestination(value);
    setSelection("");
    setPointed("");
  }, []);
  return (
    <section
      className={s.room}
      aria-label="Walk the library"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !paused && !e.defaultPrevented && e.currentTarget.contains(e.target as Node)) {
          if (onLadder) {
            e.preventDefault();
            scene.current?.toggleLadder();
            canvas.current?.focus({ preventScroll: true });
          } else onExit();
        }
      }}
    >
      <div hidden ref={jackets} aria-hidden="true">
        {rooms.flatMap((section) => section.shelves.flatMap((bay) =>
          bay.books.slice(0, bay.faceOutCount)
            .map((b) => (
              <span key={b.id} data-jacket={b.id}>
                <CoverArt slug={b.id} design={b.design} />
              </span>
            )),
        ))}
      </div>
      <div className={s.viewport}>
        <canvas
          ref={canvas}
          tabIndex={0}
          aria-label="Walkable library. Scroll up to walk forward or down to walk back. Use W A S D to move and left or right arrow to turn. In the hall, use E or select the ladder to mount or step off. On the ladder, scroll or use W and S to climb, and A and D to roll along the shelves. Follow the signs on the left and right of the main reading hall to enter subject rooms, or choose a room, shelf and volume below."
        />
        <div className={s.top}>
          <button onClick={onExit} className={s.exit}>
            ← Leave room
          </button>
          <span>
            <LibraryIcon name="compass" size={16} /> {room?.label ?? "Library"}{shelf && ` · ${shelf.label}`}
          </span>
        </div>
        {!unavailable && room?.id === "hall" && room.shelves.some((row) => row.upper) && (
          <button type="button" className={s.ladderAction} onClick={() => {
            scene.current?.toggleLadder();
            canvas.current?.focus({ preventScroll: true });
          }}>
            <LibraryIcon name="ladder" size={16} /> {onLadder ? "Step off ladder" : "Use ladder"}
          </button>
        )}
        {unavailable ? (
          <div className={s.fallback}>
            <div>
              <strong>The library catalogue</strong>
              <p>3D rendering is unavailable on this device. Choose a room, shelf and volume below to read.</p>
            </div>
          </div>
        ) : (
          <>
            <div className={s.instructions}>
              {pointed ? (
                <strong>{pointed}</strong>
              ) : onLadder ? (
                <><span>↑ ↓ to climb</span><span>A/D to roll the ladder</span><span>Select a book to read</span></>
              ) : (
                <>
                  <span>Drag to look around</span>
                  <span>Scroll to walk · A/D to step sideways</span>
                  <span>{room?.id === "hall" && rooms.length > 1 ? "Follow the signs left or right" : "Select a spine to read"}</span>
                </>
              )}
            </div>
            <div className={s.pad} aria-label="Movement">
              {(
                [
                  ["arrowleft", "↶", "Turn left"],
                  ["a", "←", onLadder ? "Roll ladder left" : "Step left"],
                  ["w", "↑", onLadder ? "Climb up" : "Walk forward"],
                  ["s", "↓", onLadder ? "Climb down" : "Walk backward"],
                  ["d", "→", onLadder ? "Roll ladder right" : "Step right"],
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
        <RoomPicker label="Room" accessibleLabel="Visit a room" options={roomOptions}
          value={String(Math.max(0, rooms.indexOf(room)))} onChange={(value) => {
            const index = Number(value);
            if (scene.current && !unavailable) scene.current.visitRoom(index);
            else enterRoom(index);
          }} walkCanvas={canvas} />
        <RoomPicker label="Shelf" accessibleLabel="Visit a shelf" options={shelfOptions}
          value={String(shelf ? destination : -1)} onChange={go} walkCanvas={canvas} />
        <RoomPicker label="Volume" accessibleLabel="Choose a volume" options={volumeOptions}
          value={chosen?.id ?? ""} onChange={setSelection} />
        <button
          type="button"
          className={s.read}
          disabled={!chosen}
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
