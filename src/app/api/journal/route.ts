import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { toDateOnly } from "@/lib/utils";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const entries = await prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 90,
  });
  return NextResponse.json(entries);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const date = toDateOnly(body.date ? new Date(body.date) : new Date());
  const entry = await prisma.journalEntry.upsert({
    where: { userId_date: { userId, date } },
    update: { mood: body.mood, energy: body.energy, stress: body.stress, text: body.text ?? undefined },
    create: {
      userId,
      date,
      mood: body.mood,
      energy: body.energy,
      stress: body.stress,
      text: body.text || null,
    },
  });
  return NextResponse.json(entry, { status: 201 });
}
