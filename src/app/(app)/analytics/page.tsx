"use client";

import AnalyticsClient from "@/components/analytics/AnalyticsClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function AnalyticsPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">{dict.pages.analytics.title}</h1>
        <p className="mt-1 text-sm text-ink-light">{dict.pages.analytics.subtitle}</p>
      </div>
      <AnalyticsClient />
    </div>
  );
}
