import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const transactions = await prisma.transaction.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 100,
  });
  return NextResponse.json(transactions);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const transaction = await prisma.transaction.create({
    data: {
      userId,
      accountId: body.accountId,
      amount: body.amount,
      category: body.category,
      description: body.description || null,
      date: new Date(body.date),
      isIncome: !!body.isIncome,
    },
  });
  const delta = body.isIncome ? body.amount : -body.amount;
  await prisma.financeAccount.update({
    where: { id: body.accountId },
    data: { balance: { increment: delta } },
  });
  return NextResponse.json(transaction, { status: 201 });
}
