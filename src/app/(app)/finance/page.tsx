"use client";

import FinanceClient from "@/components/finance/FinanceClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function FinancePage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.pages.finance.title}</h1>
      <FinanceClient />
    </div>
  );
}
