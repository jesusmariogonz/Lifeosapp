"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Repeat,
  Menu,
  X,
  Target,
  Wallet,
  HeartPulse,
  BookOpen,
  BarChart3,
  LineChart,
  Sparkles,
  Plug,
  Users,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { dict } = useTranslation();

  const NAV = [
    { href: "/", label: dict.nav.today, icon: LayoutDashboard },
    { href: "/calendar", label: dict.nav.calendar, icon: Calendar },
    { href: "/tasks", label: dict.nav.tasks, icon: CheckSquare },
    { href: "/habits", label: dict.nav.habits, icon: Repeat },
  ];

  // Everything not pinned to the bottom bar lives behind "More" on mobile.
  const MORE_NAV = [
    { href: "/goals", label: dict.nav.goals, icon: Target },
    { href: "/finance", label: dict.nav.finance, icon: Wallet },
    { href: "/wellness", label: dict.nav.wellness, icon: HeartPulse },
    { href: "/journal", label: dict.nav.journal, icon: BookOpen },
    { href: "/weekly-review", label: dict.nav.weeklyReview, icon: BarChart3 },
    { href: "/analytics", label: dict.nav.analytics, icon: LineChart },
    { href: "/assistant", label: dict.nav.assistant, icon: Sparkles },
    { href: "/relationships", label: dict.nav.relationships, icon: Users },
    { href: "/integrations", label: dict.nav.integrations, icon: Plug },
    { href: "/settings", label: dict.nav.settings, icon: Settings },
  ];
  const moreActive = MORE_NAV.some(
    (item) => pathname === item.href || pathname?.startsWith(item.href)
  );

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-30 flex flex-col justify-end bg-ink/30 md:hidden" onClick={() => setOpen(false)}>
          <div
            className="max-h-[75vh] overflow-y-auto rounded-t-2xl bg-surface p-4 shadow-soft"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="font-serif text-lg text-ink">{dict.nav.more}</span>
              <button onClick={() => setOpen(false)} className="rounded-full p-1 text-ink-light hover:bg-cream-200">
                <X size={20} />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {MORE_NAV.map((item) => {
                const active = pathname === item.href || pathname?.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center text-xs",
                      active ? "bg-sage-400 text-white shadow-soft" : "text-ink-light hover:bg-cream-200 hover:text-ink"
                    )}
                  >
                    <Icon size={20} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex flex-col items-center gap-1 rounded-xl px-2 py-3 text-center text-xs text-ink-light hover:bg-cream-200 hover:text-ink"
              >
                <LogOut size={20} />
                <span>{dict.nav.logout}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <nav className="fixed bottom-0 left-0 right-0 z-20 flex items-center justify-around border-t border-cream-300 bg-cream-100/95 py-2 backdrop-blur md:hidden">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px]",
                active ? "text-sage-600" : "text-ink-light"
              )}
            >
              <Icon size={20} />
              {item.label}
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className={cn(
            "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px]",
            moreActive ? "text-sage-600" : "text-ink-light"
          )}
        >
          <Menu size={20} />
          {dict.nav.more}
        </button>
      </nav>
    </>
  );
}
