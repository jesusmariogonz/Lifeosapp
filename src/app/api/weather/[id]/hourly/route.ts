import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { hourlyToPoints } from "@/lib/weather";

// GET /api/weather/:id/hourly?date=YYYY-MM-DD — hourly temp/condition for one
// day, tapped open from a day in the daily detail strip. Past dates go
// through Open-Meteo's archive API, today/future through the forecast API
// (both accept the same start_date/end_date + hourly params).
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Invalid or missing date" }, { status: 400 });
  }

  const location = await prisma.weatherLocation.findUnique({ where: { id: params.id } });
  if (!location || location.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const isPast = date < todayStr;
  const base = isPast ? "https://archive-api.open-meteo.com/v1/archive" : "https://api.open-meteo.com/v1/forecast";
  const url =
    `${base}?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&start_date=${date}&end_date=${date}&hourly=temperature_2m,weathercode` +
    `&temperature_unit=celsius&timezone=auto`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return NextResponse.json({ error: "Weather hourly failed" }, { status: 502 });
    const json = await res.json();
    const hours = hourlyToPoints(json?.hourly);
    return NextResponse.json({ date, hours });
  } catch {
    return NextResponse.json({ error: "Weather hourly failed" }, { status: 502 });
  }
}
