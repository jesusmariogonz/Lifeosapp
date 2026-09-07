"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Target,
  Repeat,
  Wallet,
  HeartPulse,
  BookOpen,
  BarChart3,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/goals", label: "Goals & Vision", icon: Target },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/finance", label: "Finance", icon: Wallet },
  { href: "/wellness", label: "Wellness & Health", icon: HeartPulse },
  { href: "/journal", label: "Journal", icon: BookOpen },
  { href: "/weekly-review", label: "Weekly Review", icon: BarChart3 },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:w-60 md:flex-col md:shrink-0 border-r border-cream-300/70 bg-cream-100/60 px-4 py-6">
      <div className="mb-8 px-2">
        <span className="font-serif text-2xl text-sage-600">Life OS</span>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV.map((item) => {
          const active = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition",
                active
                  ? "bg-sage-400 text-white shadow-soft"
                  : "text-ink-light hover:bg-cream-200 hover:text-ink"
              )}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="mt-4 flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-ink-light hover:bg-cream-200 hover:text-ink"
      >
        <LogOut size={18} />
        <span>Log out</span>
      </button>
    </aside>
  );
}
