CREATE TYPE "public"."admin_level" AS ENUM('super', 'support');--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'recruiter';--> statement-breakpoint
ALTER TYPE "public"."user_role" ADD VALUE 'manager';--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN "admin_level" "admin_level";