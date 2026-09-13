"use client";

import CalendarClient from "@/components/calendar/CalendarClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function CalendarPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.pages.calendar.title}</h1>
      <CalendarClient />
    </div>
  );
}
