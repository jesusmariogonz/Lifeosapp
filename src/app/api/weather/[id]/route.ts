import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

// DELETE: remove one of the current user's saved weather locations.
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const location = await prisma.weatherLocation.findUnique({ where: { id: params.id } });
  if (!location || location.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.weatherLocation.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
