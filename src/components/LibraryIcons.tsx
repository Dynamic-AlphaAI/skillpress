import type { CSSProperties } from "react";

export function LibraryIcon({
  name,
  size = 18,
  style,
}: {
  name:
    "books" | "enter" | "arrow" | "left" | "right" | "sound" | "mute" | "down" | "walk" | "close" | "compass" | "ladder" | "check" | "search" | "expand" | "collapse";
  size?: number;
  style?: CSSProperties;
}) {
  const paths = {
    books: (
      <>
        <path d="M2 4.5h4v16H2zm7-2h3.5v18H9zm5.8 3.1 3.4-.9 4 15.3-3.4.9z" />
        <path d="M2 8h4m3 9h3.5" />
      </>
    ),
    enter: (
      <>
        <path d="M3 12h14m-5-5 5 5-5 5m5-14h4v18h-4" />
      </>
    ),
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    left: <path d="m14 6-6 6 6 6" />,
    right: <path d="m10 6 6 6-6 6" />,
    sound: (
      <>
        <path d="M3 9h4l5-4v14l-5-4H3zM16 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" />
      </>
    ),
    mute: (
      <>
        <path d="M3 9h4l5-4v14l-5-4H3zm13 0 5 6m0-6-5 6" />
      </>
    ),
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
    check: <path d="m5 12 4 4 10-10" />,
    down: <path d="m7 10 5 5 5-5" />,
    walk: (
      <>
        <circle cx="14" cy="4" r="1.4" />
        <path d="m7 12 2-4 4-1 2 5 4 2M6 21l4-5 2-6m-1 4 4 3 1 4" />
      </>
    ),
    close: <path d="m5 5 14 14M19 5 5 19" />,
    expand: <path d="M9 4H4v5m11-5h5v5M4 15v5h5m11-5v5h-5" />,
    collapse: <path d="M4 9h5V4m6 0v5h5M9 20v-5H4m16 0h-5v5" />,
    ladder: <path d="m4 21 5-18m5 18 5-18M8 7h10m-11.3 5h10m-11.4 5h10" />,
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 7-2.5 6.5L7 17l3-7z" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={style}
    >
      {paths[name]}
    </svg>
  );
}
