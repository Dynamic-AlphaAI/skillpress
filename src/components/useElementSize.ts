"use client";
import { useEffect, useRef, useState } from "react";

export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      setSize((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, size] as const;
}

/** Turns wheel / trackpad / drag gestures into discrete prev/next steps. */
export function useStepGestures(onStep: (dir: 1 | -1) => void) {
  const acc = useRef(0);
  const last = useRef(0);
  const drag = useRef<{ x: number; moved: number } | null>(null);

  const onWheel = (e: React.WheelEvent) => {
    const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    acc.current += delta;
    const now = performance.now();
    if (Math.abs(acc.current) > 70 && now - last.current > 140) {
      onStep(acc.current > 0 ? 1 : -1);
      acc.current = 0;
      last.current = now;
    }
  };
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { x: e.clientX, moved: 0 };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 56) {
      onStep(dx < 0 ? 1 : -1);
      d.x = e.clientX;
      d.moved += 1;
    }
  };
  const onPointerUp = () => {
    drag.current = null;
  };
  /** True if the pointer gesture that just ended was a drag (so the click should be ignored). */
  const consumedDrag = useRef(false);
  const wrapUp = () => {
    consumedDrag.current = (drag.current?.moved ?? 0) > 0;
    onPointerUp();
  };
  return {
    handlers: { onWheel, onPointerDown, onPointerMove, onPointerUp: wrapUp, onPointerCancel: onPointerUp, onPointerLeave: onPointerUp },
    consumedDrag,
  };
}
