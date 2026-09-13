-- Objectives can now be marked complete, same as Tasks and WeeklyTargets.
ALTER TABLE "Objective" ADD COLUMN "completed" BOOLEAN NOT NULL DEFAULT false;
