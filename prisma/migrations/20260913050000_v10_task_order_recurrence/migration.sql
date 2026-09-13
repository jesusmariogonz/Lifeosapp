-- Add manual ordering support for Tasks (drag/arrow reorder in the Tasks list).
ALTER TABLE "Task" ADD COLUMN "order" INTEGER NOT NULL DEFAULT 0;

-- Add recurrence support for Tasks. A recurring task is created as a
-- template that immediately generates concrete Task rows with real
-- dueDates for a rolling window (see src/lib/recurrence.ts) — all sharing
-- "recurringGroupId" so they can be identified/deleted together as a series.
-- recurrence: null = one-time, "DAILY" | "WEEKLY" | "WEEKDAYS" | "CUSTOM".
-- recurrenceDays: day-of-week numbers using JS Date's getUTCDay() convention
-- (0=Sunday..6=Saturday), only meaningful when recurrence = "CUSTOM".
ALTER TABLE "Task" ADD COLUMN "recurrence" TEXT;
ALTER TABLE "Task" ADD COLUMN "recurrenceDays" INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[];
ALTER TABLE "Task" ADD COLUMN "recurringGroupId" TEXT;

-- CreateIndex
CREATE INDEX "Task_recurringGroupId_idx" ON "Task"("recurringGroupId");
