"use client";

import WellnessClient from "@/components/wellness/WellnessClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function WellnessPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.pages.wellness.title}</h1>
      <WellnessClient />
    </div>
  );
}
