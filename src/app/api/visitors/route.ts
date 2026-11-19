import { connection } from "next/server";

function unavailable() {
  return Response.json({ visitors: null }, {
    status: 503,
    headers: { "Cache-Control": "no-store", "Retry-After": "300" },
  });
}

export async function GET() {
  await connection();
  const token = process.env.SKILLPRESS_ANALYTICS_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) return unavailable();

  const now = new Date();
  const day = now.toISOString().slice(0, 10);
  const since = day + "T00:00:00.000Z";
  const query = new URLSearchParams({
    projectId, slug: "dynamic-alpha", by: "day", since, until: now.toISOString(),
  });

  try {
    // Vercel defaults aggregate queries to the production environment.
    const response = await fetch(`https://api.vercel.com/v1/query/web-analytics/visits/aggregate?${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return unavailable();
    const { data } = await response.json();
    if (!Array.isArray(data) || data.length > 1) return unavailable();
    const row = data[0];
    if (data.length && (!row || Date.parse(row.timestamp) !== Date.parse(since) ||
        !Number.isSafeInteger(row.visitors) || row.visitors < 0)) return unavailable();

    const tomorrow = Date.parse(since) + 86_400_000;
    const ttl = Math.max(0, Math.min(300, Math.floor((tomorrow - Date.now()) / 1000)));
    return Response.json({ day, visitors: row?.visitors ?? 0 }, {
      headers: {
        "Cache-Control": "public, max-age=0, must-revalidate",
        "Vercel-CDN-Cache-Control": `public, s-maxage=${ttl}, must-revalidate`,
      },
    });
  } catch {
    return unavailable();
  }
}
