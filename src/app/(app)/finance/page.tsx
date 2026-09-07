import FinanceClient from "@/components/finance/FinanceClient";

export default function FinancePage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">Finance</h1>
      <FinanceClient />
    </div>
  );
}
