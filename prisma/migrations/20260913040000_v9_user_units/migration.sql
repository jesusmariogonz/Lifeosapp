-- Add per-user display Units preference ("metric" | "imperial").
-- DB values remain stored in canonical units regardless of this setting
-- (WellnessLog.weight in kilograms, WellnessLog.waterOz in US fluid ounces) —
-- conversion for display/input happens at the API/UI edges only.
ALTER TABLE "User" ADD COLUMN "units" TEXT NOT NULL DEFAULT 'metric';
