import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/session";

// GET /api/weather/search?q=city — proxies the Open-Meteo geocoding API so the
// client can search by name without CORS issues, and without exposing the
// external call directly to the browser.
export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ results: [] });

  try {
    const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=en&format=json`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`Open-Meteo geocoding failed: ${res.status}`);
    const data = await res.json();
    const results = (data?.results || []).map((r: any) => ({
      name: r.name as string,
      country: r.country as string | undefined,
      admin1: r.admin1 as string | undefined,
      latitude: r.latitude as number,
      longitude: r.longitude as number,
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ results: [], error: "Search failed" }, { status: 502 });
  }
}
