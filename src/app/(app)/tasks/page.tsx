"use client";

import TasksClient from "@/components/tasks/TasksClient";
import { useTranslation } from "@/lib/i18n/LocaleProvider";

export default function TasksPage() {
  const { dict } = useTranslation();
  return (
    <div className="space-y-6">
      <h1 className="font-serif text-3xl text-ink">{dict.pages.tasks.title}</h1>
      <TasksClient />
    </div>
  );
}
