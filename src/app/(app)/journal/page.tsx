import JournalClient from "@/components/journal/JournalClient";

export default function JournalPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">Journal</h1>
      <JournalClient />
    </div>
  );
}
