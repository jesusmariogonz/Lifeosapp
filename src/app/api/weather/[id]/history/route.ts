import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { dailyToPoints } from "@/lib/weather";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// GET /api/weather/:id/history — stitches Open-Meteo's archive (past) API and
// forecast (today + future) API into one ~15 day daily series (7 days back,
// today, 7 days ahead) for the detail view.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = await prisma.weatherLocation.findUnique({ where: { id: params.id } });
  if (!location || location.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const today = new Date();
  const pastStart = new Date(today);
  pastStart.setDate(pastStart.getDate() - 7);
  const pastEnd = new Date(today);
  pastEnd.setDate(pastEnd.getDate() - 1);

  const dailyParams = "temperature_2m_max,temperature_2m_min,weathercode";

  const archiveUrl =
    `https://archive-api.open-meteo.com/v1/archive?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&start_date=${isoDate(pastStart)}&end_date=${isoDate(pastEnd)}&daily=${dailyParams}` +
    `&temperature_unit=celsius&timezone=auto`;

  const forecastUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}` +
    `&daily=${dailyParams}&temperature_unit=celsius&timezone=auto&forecast_days=8`;

  try {
    const [archiveRes, forecastRes] = await Promise.all([
      fetch(archiveUrl, { next: { revalidate: 3600 } }),
      fetch(forecastUrl, { next: { revalidate: 3600 } }),
    ]);

    const past = archiveRes.ok ? dailyToPoints((await archiveRes.json())?.daily) : [];
    const upcoming = forecastRes.ok ? dailyToPoints((await forecastRes.json())?.daily) : [];

    // Deduplicate by date in case of any overlap, keeping forecast (more current) values.
    const byDate = new Map<string, ReturnType<typeof dailyToPoints>[number]>();
    for (const p of past) byDate.set(p.date, p);
    for (const p of upcoming) byDate.set(p.date, p);
    const days = Array.from(byDate.values()).sort((a, b) => a.date.localeCompare(b.date));

    return NextResponse.json({
      location: { id: location.id, name: location.name, latitude: location.latitude, longitude: location.longitude },
      days,
    });
  } catch {
    return NextResponse.json({ error: "Weather history failed" }, { status: 502 });
  }
}
