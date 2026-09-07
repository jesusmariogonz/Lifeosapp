import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const budgets = await prisma.budget.findMany({ where: { userId } });
  return NextResponse.json(budgets);
}

export async function POST(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const budget = await prisma.budget.create({
    data: {
      userId,
      category: body.category,
      monthlyLimit: body.monthlyLimit,
      month: body.month,
    },
  });
  return NextResponse.json(budget, { status: 201 });
}
