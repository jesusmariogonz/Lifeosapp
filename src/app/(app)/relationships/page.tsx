"use client";

import RelationshipsClient from "@/components/relationships/RelationshipsClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function RelationshipsPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.pages.relationships.title}</h1>
      <RelationshipsClient />
    </div>
  );
}
