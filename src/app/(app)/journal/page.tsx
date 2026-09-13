"use client";

import JournalClient from "@/components/journal/JournalClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function JournalPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.pages.journal.title}</h1>
      <JournalClient />
    </div>
  );
}
