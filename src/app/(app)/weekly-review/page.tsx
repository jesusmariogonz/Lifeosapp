"use client";

import WeeklyReviewClient from "@/components/weekly-review/WeeklyReviewClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function WeeklyReviewPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.pages.weeklyReview.title}</h1>
      <WeeklyReviewClient />
    </div>
  );
}
