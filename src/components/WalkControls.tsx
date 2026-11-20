import { useEffect, useEffectEvent, useId, useRef, type PointerEvent, type RefObject } from "react";
import type { createRoom } from "./roomScene";
import { LibraryIcon } from "./LibraryIcons";
import s from "./WalkingRoom.module.css";

type Side = "left" | "right";
type Scene = RefObject<ReturnType<typeof createRoom> | null>;
const arrows = ["arrowleft", "arrowright", "arrowup", "arrowdown"];

/** Browsers can background a tab before dispatching a captured pointer's release. */
function useControlReset(release: () => void) {
  const reset = useEffectEvent(release);
  useEffect(() => {
    function blur() { reset(); }
    function visibility() { if (document.hidden) reset(); }
    window.addEventListener("blur", blur);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      window.removeEventListener("blur", blur);
      document.removeEventListener("visibilitychange", visibility);
      reset();
    };
  }, []);
}

function SideStep({ side, scene, onLadder }: { side: Side; scene: Scene; onLadder: boolean }) {
  const pointer = useRef<number | null>(null);
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const key = `step-${side}`;
  function release() {
    pointer.current = null;
    if (hold.current !== null) clearTimeout(hold.current);
    hold.current = null;
    scene.current?.setKey(key, false);
  }
  useControlReset(release);
  const label = onLadder ? `Roll ladder ${side}` : `Step ${side}`;
  return <button type="button" aria-label={label} title={label}
    onPointerDown={event => {
      if (event.button !== 0 || pointer.current !== null) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      pointer.current = event.pointerId;
      hold.current = setTimeout(() => {
        hold.current = null;
        scene.current?.setKey(key, true);
      }, 110);
    }}
    onPointerUp={event => {
      if (pointer.current !== event.pointerId) return;
      if (hold.current !== null) scene.current?.stepSide(side);
      release();
    }}
    onPointerCancel={release} onLostPointerCapture={release}
    onClick={event => { if (event.detail === 0) scene.current?.stepSide(side); }}>
    <span><LibraryIcon name={side} size={15} /></span>
  </button>;
}

export function WalkControls({ scene, onLadder }: { scene: Scene; onLadder: boolean }) {
  const base = useRef<HTMLDivElement>(null);
  const finger = useRef<number | null>(null);
  const description = useId();

  function releaseStick() {
    finger.current = null;
    base.current?.style.removeProperty("--stick-x");
    base.current?.style.removeProperty("--stick-y");
    scene.current?.setStick(0, 0);
    for (const key of arrows) scene.current?.setKey(key, false);
  }
  useControlReset(releaseStick);

  function moveStick(event: PointerEvent<HTMLDivElement>) {
    if (finger.current !== event.pointerId) return;
    const pad = event.currentTarget;
    const rect = pad.getBoundingClientRect();
    const radius = rect.width * 0.27;
    const dx = event.clientX - rect.left - rect.width / 2;
    const dy = event.clientY - rect.top - rect.height / 2;
    const distance = Math.hypot(dx, dy);
    const length = Math.min(distance / radius, 1);
    const x = dx / (distance || 1), y = dy / (distance || 1);
    pad.style.setProperty("--stick-x", `${x * length * radius}px`);
    pad.style.setProperty("--stick-y", `${y * length * radius}px`);
    const speed = Math.max(0, (length - 0.13) / 0.87);
    scene.current?.setStick(x * speed, -y * speed);
  }

  function endStick(event: PointerEvent<HTMLDivElement>) {
    if (event.pointerId === finger.current) releaseStick();
  }

  return (
    <div className={s.movement} role="group" aria-label="Movement controls">
      <div className={s.stick} ref={base} role="group" tabIndex={0}
        aria-label="Movement joystick" aria-describedby={description}
        onPointerDown={event => {
          if (event.button !== 0 || finger.current !== null) return;
          event.preventDefault();
          event.currentTarget.setPointerCapture(event.pointerId);
          finger.current = event.pointerId;
          moveStick(event);
        }}
        onPointerMove={moveStick} onPointerUp={endStick} onPointerCancel={endStick} onLostPointerCapture={endStick}
        onKeyDown={event => {
          const key = event.key.toLowerCase();
          if (!arrows.includes(key) || event.metaKey || event.ctrlKey || event.altKey) return;
          event.preventDefault();
          scene.current?.setKey(key, true);
        }}
        onBlur={releaseStick}>
        <span className={s.knob} aria-hidden="true" />
      </div>
      <span className={s.controlHelp} id={description}>
        {onLadder ? "Up and down to climb" : "Up to walk forward, down to walk backward"}. Left and right to turn. You can also use the arrow keys.
      </span>
      <div className={s.sideSteps}>
        <SideStep scene={scene} side="left" onLadder={onLadder} />
        <SideStep scene={scene} side="right" onLadder={onLadder} />
      </div>
    </div>
  );
}
