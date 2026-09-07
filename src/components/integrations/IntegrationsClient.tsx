"use client";

import Link from "next/link";
import { HeartPulse, Plane, Users, CheckCircle2 } from "lucide-react";

// V4: wire real Apple HealthKit / Google Fit OAuth here — WellnessLog.source already
// supports "apple_health" / "google_fit" values so synced logs slot in without a schema change.
// V4: wire real travel API here (e.g. TripIt) — trips would create/annotate Calendar events
// and flag travel days on Wellness trends.
const INTEGRATIONS = [
  {
    icon: HeartPulse,
    name: "Apple Health / Google Fit",
    description:
      "Sync sleep, steps, and exercise automatically into your Wellness logs instead of entering them manually.",
    status: "Coming soon",
  },
  {
    icon: Plane,
    name: "Travel",
    description: "Track trips so they show up on your Calendar and are noted against your Wellness trends.",
    status: "Coming soon",
  },
];

export default function IntegrationsClient() {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {INTEGRATIONS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="card flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-100 text-sage-600">
                  <Icon size={20} />
                </div>
                <h2 className="font-serif text-lg text-ink">{item.name}</h2>
              </div>
              <p className="flex-1 text-sm text-ink-light">{item.description}</p>
              <button disabled className="btn-secondary w-fit cursor-not-allowed opacity-60">
                {item.status}
              </button>
            </div>
          );
        })}

        <div className="card flex flex-col gap-3 border-sage-300 bg-sage-50/50">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sage-400 text-white">
              <Users size={20} />
            </div>
            <h2 className="font-serif text-lg text-ink">Relationships</h2>
          </div>
          <p className="flex-1 text-sm text-ink-light">
            People and important dates — birthdays, anniversaries — that feed into your Calendar and Dashboard.
          </p>
          <Link href="/relationships" className="btn-primary w-fit">
            <CheckCircle2 size={16} /> Open Relationships
          </Link>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-2 font-serif text-lg text-ink">About data sources</h2>
        <p className="text-sm text-ink-light">
          Every Wellness log already carries a <code className="rounded bg-cream-200 px-1.5 py-0.5">source</code> tag
          (defaulting to "Manual"). Once a real health integration is connected, synced entries will be tagged
          automatically and manual entries will keep working exactly as they do today.
        </p>
      </div>
    </div>
  );
}
