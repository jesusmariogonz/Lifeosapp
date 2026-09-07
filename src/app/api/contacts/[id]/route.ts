import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.contact.deleteMany({ where: { id: params.id, userId } });
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const contact = await prisma.contact.updateMany({
    where: { id: params.id, userId },
    data: {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.relationship !== undefined ? { relationship: body.relationship } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
    },
  });

  if (body.importantDates !== undefined) {
    await prisma.importantDate.deleteMany({ where: { contactId: params.id } });
    if (Array.isArray(body.importantDates) && body.importantDates.length) {
      await prisma.importantDate.createMany({
        data: body.importantDates.map((d: any) => ({
          contactId: params.id,
          label: d.label,
          date: new Date(d.date),
          recurring: d.recurring ?? true,
        })),
      });
    }
  }

  return NextResponse.json(contact);
}
