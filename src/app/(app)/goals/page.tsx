"use client";

import GoalsClient from "@/components/goals/GoalsClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function GoalsPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.pages.goals.title}</h1>
      <GoalsClient />
    </div>
  );
}
