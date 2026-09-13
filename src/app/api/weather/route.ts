import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

// GET: the current user's saved weather locations, each enriched with
// today's current temperature + condition from Open-Meteo's forecast API.
export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const locations = await prisma.weatherLocation.findMany({
    where: { userId },
    orderBy: { order: "asc" },
  });

  const enriched = await Promise.all(
    locations.map(async (loc) => {
      try {
        const url =
          `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
          `&current_weather=true&daily=weathercode,temperature_2m_max,temperature_2m_min&temperature_unit=celsius` +
          `&timezone=auto&forecast_days=1`;
        // Revalidate hourly — this is a free third-party API, don't hammer it.
        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) throw new Error(`Open-Meteo forecast failed: ${res.status}`);
        const data = await res.json();
        return {
          id: loc.id,
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          order: loc.order,
          currentTemp: data?.current_weather?.temperature ?? data?.daily?.temperature_2m_max?.[0] ?? null,
          weatherCode: data?.current_weather?.weathercode ?? data?.daily?.weathercode?.[0] ?? null,
          todayMax: data?.daily?.temperature_2m_max?.[0] ?? null,
          todayMin: data?.daily?.temperature_2m_min?.[0] ?? null,
        };
      } catch (err) {
        return {
          id: loc.id,
          name: loc.name,
          latitude: loc.latitude,
          longitude: loc.longitude,
          order: loc.order,
          currentTemp: null,
          weatherCode: null,
          todayMax: null,
          todayMin: null,
          error: true,
        };
      }
    })
  );

  return NextResponse.json(enriched);
}

// POST: add a new saved location for the current user (name, latitude, longitude).
export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  if (!body?.name || typeof body.latitude !== "number" || typeof body.longitude !== "number") {
    return NextResponse.json({ error: "name, latitude and longitude are required" }, { status: 400 });
  }

  const count = await prisma.weatherLocation.count({ where: { userId } });
  const location = await prisma.weatherLocation.create({
    data: {
      userId,
      name: body.name,
      latitude: body.latitude,
      longitude: body.longitude,
      order: count,
    },
  });

  return NextResponse.json(location, { status: 201 });
}
