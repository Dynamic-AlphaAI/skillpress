"use client";

import { Analytics, type BeforeSend } from "@vercel/analytics/next";

const publicPageOnly: BeforeSend = (event) => {
  const url = new URL(event.url, window.location.origin);
  if (url.hostname !== "skillpress.xyz" && url.hostname !== "www.skillpress.xyz") return null;
  return { ...event, url: url.origin + url.pathname };
};

export function SiteAnalytics() {
  return <Analytics beforeSend={publicPageOnly} />;
}
