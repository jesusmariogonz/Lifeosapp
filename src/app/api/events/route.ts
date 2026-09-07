import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const events = await prisma.event.findMany({
    where: {
      userId,
      ...(from && to
        ? { startsAt: { gte: new Date(from) }, endsAt: { lte: new Date(to) } }
        : {}),
    },
    orderBy: { startsAt: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const event = await prisma.event.create({
    data: {
      userId,
      title: body.title,
      description: body.description || null,
      startsAt: new Date(body.startsAt),
      endsAt: new Date(body.endsAt),
      allDay: !!body.allDay,
      location: body.location || null,
    },
  });
  return NextResponse.json(event, { status: 201 });
}
