import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { runSeed } from "../../../../../prisma/seedData";

// One-time/idempotent demo-data seeding endpoint for production, since the
// CLI seed script can't reach a database that only exists inside Vercel's
// build/runtime environment. Protected by a secret so it can't be triggered
// by anyone else. Safe to call multiple times — it replaces the demo user.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-seed-secret");
  if (!secret || secret !== process.env.ADMIN_SEED_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await runSeed(prisma);
  return NextResponse.json({ ok: true, ...result });
}
