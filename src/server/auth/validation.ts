import { z } from "zod";
import { CATEGORIES, CITIES, REGION_IDS, VENUE_TYPES, type CategoryId, type CityId, type VenueTypeId } from "@/lib/catalog";

/*
 * Form schemas shared by the auth server actions. Error messages are translation keys
 * under `auth.errors` so the form can show them in the visitor's language.
 */

export const PASSWORD_MIN = 8;

const email = z.string().trim().toLowerCase().pipe(z.email({ error: "email" }));
const password = z.string().min(PASSWORD_MIN, { error: "passwordShort" }).max(72, { error: "passwordLong" });
const required = (max: number) => z.string().trim().min(1, { error: "required" }).max(max, { error: "tooLong" });

export const loginSchema = z.object({ email, password: z.string().min(1, { error: "required" }) });
export const emailOnlySchema = z.object({ email });
export const newPasswordSchema = z.object({ password });

const cityIds = Object.keys(CITIES) as [CityId, ...CityId[]];
const categoryIds = CATEGORIES.map((c) => c.id) as [CategoryId, ...CategoryId[]];
const venueTypeIds = Object.keys(VENUE_TYPES) as [VenueTypeId, ...VenueTypeId[]];

const common = {
  email,
  password,
  region: z.enum(REGION_IDS as ["vn", "ca"], { error: "required" }),
  city: z.enum(cityIds, { error: "required" }),
};

export const registerSchema = z
  .discriminatedUnion("role", [
    z.object({ role: z.literal("artist"), ...common, name: required(80), category: z.enum(categoryIds, { error: "required" }) }),
    z.object({ role: z.literal("venue"), ...common, name: required(80), business: required(120), venueType: z.enum(venueTypeIds, { error: "required" }) }),
    z.object({ role: z.literal("client"), ...common, name: required(80) }),
  ], { error: "required" })
  .refine((v) => CITIES[v.city].region === v.region, { path: ["city"], error: "cityRegion" });

export type RegisterInput = z.infer<typeof registerSchema>;

/** First error key per field, e.g. `{ email: "email", city: "cityRegion" }`. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    out[key] ??= issue.message;
  }
  return out;
}

/** URL-safe slug without Vietnamese diacritics: "Lam Thảo Vy" → "lam-thao-vy". */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "artist";
}
