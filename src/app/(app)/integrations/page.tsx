import IntegrationsClient from "@/components/integrations/IntegrationsClient";

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Integrations</h1>
        <p className="mt-1 text-sm text-ink-light">
          Connect outside data sources to Life OS. Real connections are coming — Relationships already works today.
        </p>
      </div>
      <IntegrationsClient />
    </div>
  );
}
