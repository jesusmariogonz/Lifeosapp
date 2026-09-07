import CalendarClient from "@/components/calendar/CalendarClient";

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">Calendar</h1>
      <CalendarClient />
    </div>
  );
}
