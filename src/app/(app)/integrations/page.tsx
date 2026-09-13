"use client";

import IntegrationsClient from "@/components/integrations/IntegrationsClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function IntegrationsPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">{dict.pages.integrations.title}</h1>
        <p className="mt-1 text-sm text-ink-light">{dict.pages.integrations.subtitle}</p>
      </div>
      <IntegrationsClient />
    </div>
  );
}
