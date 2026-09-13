-- Add per-user Settings: timezone (IANA string), currency (ISO 4217), theme
ALTER TABLE "User" ADD COLUMN "timezone" TEXT NOT NULL DEFAULT 'UTC';
ALTER TABLE "User" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'USD';
ALTER TABLE "User" ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'light';
