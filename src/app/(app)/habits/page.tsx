import HabitsClient from "@/components/habits/HabitsClient";

export default function HabitsPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">Habits</h1>
      <HabitsClient />
    </div>
  );
}
