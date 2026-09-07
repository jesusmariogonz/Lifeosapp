import AnalyticsClient from "@/components/analytics/AnalyticsClient";

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Analytics</h1>
        <p className="mt-1 text-sm text-ink-light">Trends and honest observations across your habits, tasks, wellness, finances, and journal.</p>
      </div>
      <AnalyticsClient />
    </div>
  );
}
