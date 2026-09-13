import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/session";
import { isValidTimeZone } from "@/lib/tz";
import { SUPPORTED_CURRENCIES } from "@/lib/currency";
import { SUPPORTED_LOCALES } from "@/lib/i18n/dictionaries";

const VALID_THEMES = ["light", "night", "calm"];
const VALID_CURRENCIES = new Set(SUPPORTED_CURRENCIES.map((c) => c.code));
const VALID_LOCALES = new Set<string>(SUPPORTED_LOCALES);

export async function GET() {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, currency: true, theme: true, locale: true },
  });
  if (!user) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const userId = await getCurrentUserId();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();

  const data: { timezone?: string; currency?: string; theme?: string; locale?: string } = {};

  if (body.timezone !== undefined) {
    if (!isValidTimeZone(body.timezone)) {
      return NextResponse.json({ error: "Invalid timezone" }, { status: 400 });
    }
    data.timezone = body.timezone;
  }

  if (body.currency !== undefined) {
    if (!VALID_CURRENCIES.has(body.currency)) {
      return NextResponse.json({ error: "Invalid currency" }, { status: 400 });
    }
    data.currency = body.currency;
  }

  if (body.theme !== undefined) {
    if (!VALID_THEMES.includes(body.theme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }
    data.theme = body.theme;
  }

  if (body.locale !== undefined) {
    if (!VALID_LOCALES.has(body.locale)) {
      return NextResponse.json({ error: "Invalid locale" }, { status: 400 });
    }
    data.locale = body.locale;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: { timezone: true, currency: true, theme: true, locale: true },
  });

  return NextResponse.json(user);
}
