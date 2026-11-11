import {
  boolean, date, integer, jsonb, numeric, pgEnum, pgTable, primaryKey, smallint, text, timestamp, uuid,
} from "drizzle-orm/pg-core";
import { authUsers } from "drizzle-orm/supabase";
import type { Localized } from "@/lib/catalog";

/*
 * Every table has RLS enabled with no policies: Supabase exposes `public` through its REST API
 * with the publishable key, and all app access goes through Drizzle on the server instead.
 */

// `authUsers` (Supabase-managed auth.users) is imported, not exported, so drizzle-kit never tries to create it.

/** `recruiter` = recruitment manager, `manager` = artist manager acting for several artists (meeting 2026-11-07). */
export const roleEnum = pgEnum("user_role", ["venue", "artist", "client", "admin", "recruiter", "manager"]);
/** Olive admins only: a super admin changes rates and fees, support staff can read them. */
export const adminLevelEnum = pgEnum("admin_level", ["super", "support"]);
export const regionEnum = pgEnum("region", ["vn", "ca"]);
export const artistStatusEnum = pgEnum("artist_status", ["pending", "active", "suspended"]);
export const travelAreaEnum = pgEnum("travel_area", ["local", "region", "intl"]);
export const mediaKindEnum = pgEnum("media_kind", ["video", "audio", "photo"]);

const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updatedAt = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date());

export const profiles = pgTable("profiles", {
  userId: uuid("user_id").primaryKey().references(() => authUsers.id, { onDelete: "cascade" }),
  role: roleEnum("role").notNull(),
  /** Set for role `admin` only. */
  adminLevel: adminLevelEnum("admin_level"),
  locale: text("locale").notNull().default("vi"),
  createdAt: createdAt(),
}).enableRLS();

export interface Social { fb?: string; ig?: string; tt?: string; yt?: string }

export const artists = pgTable("artists", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => profiles.userId, { onDelete: "cascade" }),
  /** Id from docs/demo/seed.json, so seeding is idempotent. Null for real sign-ups. */
  seedRef: text("seed_ref").unique(),
  slug: text("slug").notNull().unique(),
  region: regionEnum("region").notNull(),
  name: text("name").notNull(),
  kind: jsonb("kind").$type<Localized>(),
  category: text("category").notNull(),
  genres: text("genres").array().notNull().default([]),
  city: text("city").notNull(),
  travelArea: travelAreaEnum("travel_area").notNull().default("local"),
  hue: smallint("hue").notNull(),
  bio: jsonb("bio").$type<Localized>(),
  usp: jsonb("usp").$type<Localized>(),
  eventTypes: text("event_types").array().notNull().default([]),
  responseTime: jsonb("response_time").$type<Localized>(),
  /** Money in the region's minor unit (VND đồng, CAD cents). */
  priceMin: integer("price_min"),
  priceMax: integer("price_max"),
  defaultFee: integer("default_fee"),
  social: jsonb("social").$type<Social>().notNull().default({}),
  status: artistStatusEnum("status").notNull().default("pending"),
  verified: boolean("verified").notNull().default(false),
  topPerformer: boolean("top_performer").notNull().default(false),
  ratingAvg: numeric("rating_avg", { precision: 2, scale: 1, mode: "number" }).notNull().default(0),
  reviewsCount: integer("reviews_count").notNull().default(0),
  bookingsCount: integer("bookings_count").notNull().default(0),
  joinedYear: smallint("joined_year"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();

/** Visible only to the artist and Olive admins; contact fields also to venues once a booking is confirmed. */
export const artistPrivate = pgTable("artist_private", {
  artistId: uuid("artist_id").primaryKey().references(() => artists.id, { onDelete: "cascade" }),
  phone: text("phone"),
  email: text("email"),
  payoutAccount: text("payout_account"),
  internalNote: text("internal_note"),
}).enableRLS();

export const artistPackages = pgTable("artist_packages", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  name: jsonb("name").$type<Localized>().notNull(),
  durationLabel: jsonb("duration_label").$type<Localized>().notNull(),
  priceFrom: integer("price_from").notNull(),
  sort: smallint("sort").notNull().default(0),
}).enableRLS();

export const artistMedia = pgTable("artist_media", {
  id: uuid("id").primaryKey().defaultRandom(),
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  kind: mediaKindEnum("kind").notNull(),
  title: text("title").notNull(),
  url: text("url"),
  lengthLabel: text("length_label"),
  sort: smallint("sort").notNull().default(0),
}).enableRLS();

export const artistBusyDates = pgTable("artist_busy_dates", {
  artistId: uuid("artist_id").notNull().references(() => artists.id, { onDelete: "cascade" }),
  date: date("date", { mode: "string" }).notNull(),
}, (t) => [primaryKey({ columns: [t.artistId, t.date] })]).enableRLS();

export const venues = pgTable("venues", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().unique().references(() => profiles.userId, { onDelete: "cascade" }),
  seedRef: text("seed_ref").unique(),
  region: regionEnum("region").notNull(),
  businessName: text("business_name").notNull(),
  type: text("type").notNull(),
  contactName: text("contact_name").notNull(),
  city: text("city").notNull(),
  address: text("address"),
  hue: smallint("hue").notNull(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}).enableRLS();

/** Visible only to the venue and Olive admins; contact fields also to artists once a booking is confirmed. */
export const venuePrivate = pgTable("venue_private", {
  venueId: uuid("venue_id").primaryKey().references(() => venues.id, { onDelete: "cascade" }),
  phone: text("phone"),
  email: text("email"),
  payoutInfo: text("payout_info"),
}).enableRLS();

export type Role = (typeof roleEnum.enumValues)[number];
