import AssistantClient from "@/components/assistant/AssistantClient";

export default function AssistantPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-3xl text-ink">Assistant</h1>
        <p className="mt-1 text-sm text-ink-light">
          Ask about your day, your goals, or get a suggested plan — grounded in your real data.
        </p>
      </div>
      <AssistantClient />
    </div>
  );
}
