CREATE TYPE "public"."artist_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TYPE "public"."media_kind" AS ENUM('video', 'audio', 'photo');--> statement-breakpoint
CREATE TYPE "public"."region" AS ENUM('vn', 'ca');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('venue', 'artist', 'admin');--> statement-breakpoint
CREATE TYPE "public"."travel_area" AS ENUM('local', 'region', 'intl');--> statement-breakpoint
CREATE TABLE "artist_busy_dates" (
	"artist_id" uuid NOT NULL,
	"date" date NOT NULL,
	CONSTRAINT "artist_busy_dates_artist_id_date_pk" PRIMARY KEY("artist_id","date")
);
--> statement-breakpoint
ALTER TABLE "artist_busy_dates" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "artist_media" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"kind" "media_kind" NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"length_label" text,
	"sort" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artist_media" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "artist_packages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"artist_id" uuid NOT NULL,
	"name" jsonb NOT NULL,
	"duration_label" jsonb NOT NULL,
	"price_from" integer NOT NULL,
	"sort" smallint DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "artist_packages" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "artist_private" (
	"artist_id" uuid PRIMARY KEY NOT NULL,
	"phone" text,
	"email" text,
	"payout_account" text,
	"internal_note" text
);
--> statement-breakpoint
ALTER TABLE "artist_private" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "artists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"seed_ref" text,
	"slug" text NOT NULL,
	"region" "region" NOT NULL,
	"name" text NOT NULL,
	"kind" jsonb,
	"category" text NOT NULL,
	"genres" text[] DEFAULT '{}' NOT NULL,
	"city" text NOT NULL,
	"travel_area" "travel_area" DEFAULT 'local' NOT NULL,
	"hue" smallint NOT NULL,
	"bio" jsonb,
	"usp" jsonb,
	"event_types" text[] DEFAULT '{}' NOT NULL,
	"response_time" jsonb,
	"price_min" integer,
	"price_max" integer,
	"default_fee" integer,
	"social" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"status" "artist_status" DEFAULT 'pending' NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"top_performer" boolean DEFAULT false NOT NULL,
	"rating_avg" numeric(2, 1) DEFAULT 0 NOT NULL,
	"reviews_count" integer DEFAULT 0 NOT NULL,
	"bookings_count" integer DEFAULT 0 NOT NULL,
	"joined_year" smallint,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "artists_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "artists_seed_ref_unique" UNIQUE("seed_ref"),
	CONSTRAINT "artists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "artists" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"role" "user_role" NOT NULL,
	"locale" text DEFAULT 'vi' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "venue_private" (
	"venue_id" uuid PRIMARY KEY NOT NULL,
	"phone" text,
	"email" text,
	"payout_info" text
);
--> statement-breakpoint
ALTER TABLE "venue_private" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "venues" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"seed_ref" text,
	"region" "region" NOT NULL,
	"business_name" text NOT NULL,
	"type" text NOT NULL,
	"contact_name" text NOT NULL,
	"city" text NOT NULL,
	"address" text,
	"hue" smallint NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "venues_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "venues_seed_ref_unique" UNIQUE("seed_ref")
);
--> statement-breakpoint
ALTER TABLE "venues" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "artist_busy_dates" ADD CONSTRAINT "artist_busy_dates_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_media" ADD CONSTRAINT "artist_media_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_packages" ADD CONSTRAINT "artist_packages_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artist_private" ADD CONSTRAINT "artist_private_artist_id_artists_id_fk" FOREIGN KEY ("artist_id") REFERENCES "public"."artists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "artists" ADD CONSTRAINT "artists_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venue_private" ADD CONSTRAINT "venue_private_venue_id_venues_id_fk" FOREIGN KEY ("venue_id") REFERENCES "public"."venues"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "venues" ADD CONSTRAINT "venues_user_id_profiles_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("user_id") ON DELETE cascade ON UPDATE no action;