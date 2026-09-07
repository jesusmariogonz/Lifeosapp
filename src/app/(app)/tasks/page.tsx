import TasksClient from "@/components/tasks/TasksClient";

export default function TasksPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">Tasks</h1>
      <TasksClient />
    </div>
  );
}
