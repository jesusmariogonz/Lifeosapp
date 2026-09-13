"use client";

import AssistantClient from "@/components/assistant/AssistantClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function AssistantPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">{dict.pages.assistant.title}</h1>
        <p className="mt-1 text-sm text-ink-light">{dict.pages.assistant.subtitle}</p>
      </div>
      <AssistantClient />
    </div>
  );
}
