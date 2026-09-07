import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const accounts = await prisma.financeAccount.findMany({ where: { userId } });
  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const account = await prisma.financeAccount.create({
    data: { userId, name: body.name, type: body.type, balance: body.balance ?? 0 },
  });
  return NextResponse.json(account, { status: 201 });
}
