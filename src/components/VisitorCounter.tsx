"use client";

import { useEffect, useState } from "react";
import s from "./ReadingRoom.module.css";

const refreshInterval = 300_000;
const format = new Intl.NumberFormat("en-US");

export function VisitorCounter() {
  const [display, setDisplay] = useState("…");

  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function refresh() {
      try {
        const response = await fetch("/api/visitors", { signal: controller.signal });
        if (!response.ok) throw new Error("Count unavailable");
        const { day, visitors } = await response.json();
        if (day !== new Date().toISOString().slice(0, 10) || !Number.isSafeInteger(visitors) || visitors < 0) {
          throw new Error("Invalid count");
        }
        setDisplay(format.format(visitors));
      } catch {
        if (controller.signal.aborted) return;
        setDisplay("Unavailable");
      }
      if (!controller.signal.aborted) {
        const now = new Date();
        const midnight = now.setUTCHours(24, 0, 0, 0);
        timer = setTimeout(refresh, Math.min(refreshInterval, Math.max(1000, midnight - Date.now())));
      }
    }
    void refresh();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, []);

  return (
    <footer className={s.visitors} title="Unique visitors since midnight UTC. Updated every five minutes.">
      <span>Visitors today <small>(UTC)</small></span>
      <strong>{display}</strong>
    </footer>
  );
}
