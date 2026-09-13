import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/settings/SettingsClient";
import { getUserLocale } from "@/lib/i18n/getUserLocale";
import { getDictionary } from "@/lib/i18n/dictionaries";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;
  const [user, locale] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { timezone: true, currency: true, theme: true, locale: true, birthday: true },
    }),
    getUserLocale(userId),
  ]);
  const dict = getDictionary(locale);

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.settings.title}</h1>
      <SettingsClient
        initialTimezone={user?.timezone || "UTC"}
        initialCurrency={user?.currency || "USD"}
        initialTheme={user?.theme || "light"}
        initialLocale={user?.locale || "en"}
        initialBirthday={user?.birthday ? user.birthday.toISOString().slice(0, 10) : ""}
      />
    </div>
  );
}
