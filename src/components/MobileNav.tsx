"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  CheckSquare,
  Repeat,
  Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Today", icon: LayoutDashboard },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/habits", label: "Habits", icon: Repeat },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
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
      <Link href="/goals" className="flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[11px] text-ink-light">
        <Menu size={20} />
        More
      </Link>
    </nav>
  );
}
