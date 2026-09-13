-- Add per-user Settings: birthday (nullable — surfaces as a recurring yearly event)
ALTER TABLE "User" ADD COLUMN "birthday" TIMESTAMP(3);
