import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import SettingsClient from "@/components/settings/SettingsClient";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  const userId = (session!.user as any).id as string;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { timezone: true, currency: true, theme: true },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">Settings</h1>
      <SettingsClient
        initialTimezone={user?.timezone || "UTC"}
        initialCurrency={user?.currency || "USD"}
        initialTheme={user?.theme || "light"}
      />
    </div>
  );
}
