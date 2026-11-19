"use client";
import { useSyncExternalStore } from "react";

/**
 * The query string as the single source of truth for what's on screen. The page itself
 * is static: the server renders the default state, and the browser reads the real URL
 * right after hydration (useSyncExternalStore handles the hand-off without a mismatch).
 */
const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener("popstate", onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener("popstate", onChange);
  };
}

export function useSearch() {
  return useSyncExternalStore(
    subscribe,
    () => window.location.search,
    () => "",
  );
}

/** Keep typing in the current history entry and let navigation create a new one. */
export function writeSearch(q: URLSearchParams, { notify = true, push = false, fromResults = false } = {}) {
  const qs = q.toString().replace(/=(&|$)/g, "$1");
  const next = qs ? `?${qs}` : window.location.pathname;
  if (next !== window.location.search && !(qs === "" && window.location.search === "")) {
    const returnToResults = push ? fromResults : window.history.state?.skillPressFromResults;
    const state = returnToResults ? { skillPressFromResults: true } : null;
    if (push) window.history.pushState(state, "", next);
    else window.history.replaceState(state, "", next);
  }
  if (notify) listeners.forEach((l) => l());
}
