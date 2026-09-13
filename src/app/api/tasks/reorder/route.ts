import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

// Batch-updates the manual `order` field for a set of tasks in one request,
// so drag/arrow reordering in the UI can persist in a single round-trip.
export async function PATCH(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const updates: { id: string; order: number }[] = Array.isArray(body.updates) ? body.updates : [];

  await prisma.$transaction(
    updates.map(({ id, order }) => prisma.task.updateMany({ where: { id, userId }, data: { order } }))
  );

  return NextResponse.json({ ok: true });
}
