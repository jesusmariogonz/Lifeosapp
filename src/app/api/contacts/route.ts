import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contacts = await prisma.contact.findMany({
    where: { userId },
    include: { importantDates: { orderBy: { date: "asc" } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(contacts);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      userId,
      name: body.name,
      relationship: body.relationship || null,
      notes: body.notes || null,
      importantDates: {
        create: (body.importantDates || []).map((d: any) => ({
          label: d.label,
          date: new Date(d.date),
          recurring: d.recurring ?? true,
        })),
      },
    },
    include: { importantDates: true },
  });
  return NextResponse.json(contact, { status: 201 });
}
