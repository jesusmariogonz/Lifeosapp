import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import "./globals.css";
import Providers from "@/components/Providers";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  weight: ["400", "500", "600"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Life OS",
  description: "Your calm, all-in-one personal life management dashboard.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Read the signed-in user's saved theme server-side so the correct
  // data-theme attribute is present on first paint (avoids a flash of the
  // wrong theme instead of only applying it after client hydration).
  let theme = "light";
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id as string | undefined;
    if (userId) {
      const user = await prisma.user.findUnique({ where: { id: userId }, select: { theme: true } });
      if (user?.theme) theme = user.theme;
    }
  } catch {
    // Not signed in / DB unavailable at build time — fall back to light.
  }

  return (
    <html lang="en" data-theme={theme} className={`${fraunces.variable} ${inter.variable}`}>
      <body className="font-sans bg-cream-100 text-ink antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
