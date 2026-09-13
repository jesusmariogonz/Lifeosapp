-- Add per-user Settings: locale (UI language, "en" | "es")
ALTER TABLE "User" ADD COLUMN "locale" TEXT NOT NULL DEFAULT 'en';
