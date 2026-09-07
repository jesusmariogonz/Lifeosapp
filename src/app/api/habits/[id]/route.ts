import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const habit = await prisma.habit.findFirst({ where: { id: params.id, userId } });
  if (!habit) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.habit.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
