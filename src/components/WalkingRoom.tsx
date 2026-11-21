"use client";

import { useCallback, useEffect, useEffectEvent, useLayoutEffect, useMemo, useRef, useState } from "react";
import { planRooms } from "@/lib/roomShelves";
import type { Book } from "@/lib/types";
import { providerNote } from "@/lib/platforms";
import { createRoom } from "./roomScene";
import { EditionJacket } from "./EditionJacket";
import { CoverArt } from "./CoverArt";
import { WalkControls } from "./WalkControls";
import { RoomPicker } from "./RoomPicker";
import { LibraryIcon } from "./LibraryIcons";
import { planSponsorSpots, type SponsorCreative } from "@/lib/sponsors";
import { useSponsorBookings } from "./useSponsorBookings";
import { SponsorDialog } from "./SponsorDialog";
import s from "./WalkingRoom.module.css";

export default function WalkingRoom({
  books,
  paused,
  expanded,
  onExpand,
  onOpen,
  onExit,
}: {
  books: Book[];
  paused: boolean;
  expanded: boolean;
  onExpand: (value: boolean) => void;
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
  const [ladderAvailable, setLadderAvailable] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const rooms = useMemo(() => planRooms(books), [books]);
  const spots = useMemo(() => rooms.length ? planSponsorSpots(rooms[0]) : [], [rooms]);
  const [spotId, setSpotId] = useState<string | null>(null);
  const [previews, setPreviews] = useState<Record<string, SponsorCreative>>({});
  const selectedSpot = spots.find(spot => spot.id === spotId);
  const { inventory, notice, checkout, release, ownsHold } = useSponsorBookings(setSpotId);
  const overrides = useMemo(() => {
    const result = { ...previews };
    for (const [id, booking] of Object.entries(inventory.bookings)) {
      if (booking.status === "paid" && booking.creative) result[id] = booking.creative;
    }
    return result;
  }, [previews, inventory.bookings]);
  const rendered = useRef(new Map<string, string>());
  const syncSigns = useEffectEvent((world: ReturnType<typeof createRoom>) => {
    for (const spot of spots) {
      const creative = overrides[spot.id];
      const signature = creative ? JSON.stringify(creative) : undefined;
      if (rendered.current.get(spot.id) === signature) continue;
      world.previewSponsor(spot, creative);
      if (signature) rendered.current.set(spot.id, signature);
      else rendered.current.delete(spot.id);
    }
  });
  const jacketArt = useMemo(() => rooms.flatMap(section => section.shelves.flatMap(shelf =>
    shelf.books.slice(0, shelf.faceOutCount).map(book => (
      <span key={book.id} data-jacket={book.id}>
        {book.design.jacket ? <EditionJacket book={book} /> : <CoverArt slug={book.id} design={book.design} />}
      </span>
    )),
  )), [rooms]);
  const room = rooms[roomIndex] ?? rooms[0];
  const hasLadder = !unavailable && ladderAvailable;
  const shelf = room?.shelves[destination];
  const volumes = useMemo(() => shelf?.books ?? room?.shelves.flatMap((row) => row.books) ?? [], [shelf, room]);
  const chosen = volumes.find((b) => b.id === selection) ?? volumes[0];
  const provider = chosen && providerNote(chosen);
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
    value: book.id, label: `${book.design.title} · ${book.source.author}`,
  })), [volumes]);
  const openBook = useEffectEvent((id: string) => {
    const index = books.findIndex((b) => b.id === id);
    if (index >= 0) onOpen(index);
  });
  const [windowElement, setWindowElement] = useState<HTMLDialogElement | null>(null);
  const resizeControl = useRef<HTMLButtonElement>(null);
  const modal = expanded && !paused;
  useLayoutEffect(() => {
    if (!windowElement) return;
    // The same canvas stays mounted while the dialog moves in and out of the top layer.
    if (modal && !windowElement.matches(":modal")) {
      if (windowElement.open) windowElement.close();
      windowElement.showModal();
      (canvas.current ?? resizeControl.current)?.focus({ preventScroll: true });
    } else if (!modal && windowElement.matches(":modal")) {
      windowElement.close();
      windowElement.setAttribute("open", "");
      if (!paused) resizeControl.current?.focus({ preventScroll: true });
    }
  }, [windowElement, modal, paused]);
  const focusOnEntry = useRef(true);
  useEffect(() => {
    if (!canvas.current || !rooms.length) return;
    try {
      const world = createRoom(canvas.current, rooms, jackets.current!, spots, {
        enterRoom,
        sponsor: setSpotId,
        ladderAvailable: setLadderAvailable,
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
      rendered.current.clear();
      syncSigns(world);
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
  }, [rooms, spots, enterRoom]);
  useEffect(() => {
    if (scene.current) syncSigns(scene.current);
  }, [overrides]);
  useEffect(() => {
    scene.current?.pause(paused || !!selectedSpot);
  }, [paused, rooms, selectedSpot]);
  const go = useCallback((shelf: string) => {
    const value = Number(shelf);
    scene.current?.visit(value);
    setDestination(value);
    setSelection("");
    setPointed("");
  }, []);
  return (
    <dialog open ref={setWindowElement} role={modal ? "dialog" : "region"} aria-modal={modal || undefined}
      className={s.room}
      onCancel={event => {
        event.preventDefault();
        if (!selectedSpot && modal && !windowElement?.querySelector('[role="listbox"]')) onExpand(false);
      }}
      onClick={event => {
        if (!modal || event.target !== event.currentTarget) return;
        const rect = event.currentTarget.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) onExpand(false);
      }}
      aria-label="Walk the library"
      onKeyDown={(e) => {
        if (e.key === "Escape" && !paused && !e.defaultPrevented && e.currentTarget.contains(e.target as Node)) {
          if (windowElement?.querySelector('[role="listbox"]')) return;
          if (modal) {
            e.preventDefault();
            onExpand(false);
          } else if (onLadder) {
            e.preventDefault();
            scene.current?.toggleLadder();
            canvas.current?.focus({ preventScroll: true });
          } else onExit();
        }
      }}
    >
      <div hidden ref={jackets} aria-hidden="true">{jacketArt}</div>
      <div className={s.viewport}>
        <canvas
          ref={canvas}
          tabIndex={0}
          aria-label={"Walkable library. Move the joystick up or down to walk and left or right to turn. Scroll up to walk forward or down to walk back. Use W A S D to move and left or right arrow to turn. " +
            (hasLadder ? "Select a wall ladder, or press E for the nearest ladder. Scroll or use W and S to climb. Use A and D to roll along the wall and E to step off. " : "") +
            "Follow the signs to the subject rooms, or choose a room, shelf and volume below."}
        />
        <div className={s.top}>
          <button onClick={onExit} className={s.exit}>
            ← Leave room
          </button>
          {room?.id === "hall" && <button type="button" className={s.exit} aria-haspopup="dialog"
            onClick={() => setSpotId(spots[0].id)}>Sponsors</button>}
          <span className={s.roomName}>
            <LibraryIcon name="compass" size={16} /> <span>{room?.label ?? "Library"}{shelf && ` · ${shelf.label}`}</span>
          </span>
          <button type="button" className={s.resize} ref={resizeControl}
            aria-label={expanded ? "Close expanded view" : "Expand library"} title={expanded ? "Close expanded view" : "Expand library"}
            onClick={() => onExpand(!expanded)}>
            <LibraryIcon name={expanded ? "collapse" : "expand"} size={18} />
          </button>
        </div>
        {hasLadder && (
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
                <><span>Joystick up or down to climb</span><span>Step sideways to roll the ladder</span></>
              ) : (
                <>
                  <span>Joystick to walk and turn</span>
                  <span>Drag to look around</span>
                  <span>{room?.id === "hall" && rooms.length > 1 ? "Follow the signs left or right" : "Select a spine to read"}</span>
                </>
              )}
            </div>
            {!paused && !selectedSpot && <WalkControls key={modal ? "expanded" : "inline"} scene={scene} onLadder={onLadder} />}
          </>
        )}
      </div>
      <div className={s.desk}>
        <RoomPicker portalContainer={modal ? windowElement : undefined} label="Room" accessibleLabel="Visit a room" options={roomOptions}
          value={String(Math.max(0, rooms.indexOf(room)))} onChange={(value) => {
            const index = Number(value);
            if (scene.current && !unavailable) scene.current.visitRoom(index);
            else enterRoom(index);
          }} walkCanvas={canvas} />
        <RoomPicker portalContainer={modal ? windowElement : undefined} label="Shelf" accessibleLabel="Visit a shelf" options={shelfOptions}
          value={String(shelf ? destination : -1)} onChange={go} walkCanvas={canvas} />
        <RoomPicker portalContainer={modal ? windowElement : undefined} label="Volume" accessibleLabel="Choose a volume" options={volumeOptions}
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
        {provider && <small className={s.providerNote}>{provider}</small>}
      </div>
      {selectedSpot && <SponsorDialog spots={spots} spot={selectedSpot} preview={previews[selectedSpot.id]}
        inventory={inventory} notice={notice?.spot === selectedSpot.id ? notice.text : undefined}
        ownsHold={ownsHold(selectedSpot.id)} onCheckout={creative => checkout(selectedSpot.id, creative)}
        onRelease={() => release(selectedSpot.id)} onSelect={setSpotId} onClose={() => setSpotId(null)} canView={!unavailable}
        onView={() => { scene.current?.viewSponsor(selectedSpot); setSpotId(null); }}
        onPreview={creative => {
          if (inventory.bookings[selectedSpot.id]?.status === "paid") return;
          setPreviews(previous => {
            const next = { ...previous };
            if (creative) next[selectedSpot.id] = creative;
            else delete next[selectedSpot.id];
            return next;
          });
          if (!unavailable) {
            scene.current?.viewSponsor(selectedSpot);
            setSpotId(null);
          }
        }} />}
    </dialog>
  );
}
