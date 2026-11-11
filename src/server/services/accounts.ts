import "server-only";
import { randomBytes } from "node:crypto";
import { getDb } from "@/server/db/client";
import { artistPrivate, artists, profiles, venuePrivate, venues } from "@/server/db/schema";
import { slugify, type RegisterInput } from "@/server/auth/validation";
import type { Locale } from "@/lib/catalog";

const randomHue = () => Math.floor(Math.random() * 360);
const shortId = () => randomBytes(3).toString("hex");

/**
 * Create the profile and the artist/venue records for a freshly created auth user, in one transaction.
 * New artists start as `pending` until Olive approves them.
 */
export async function createAccountRecords(userId: string, input: Exclude<RegisterInput, { role: "client" }>, locale: Locale): Promise<void> {
  await getDb().transaction(async (tx) => {
    await tx.insert(profiles).values({ userId, role: input.role, locale });
    if (input.role === "artist") {
      const [artist] = await tx
        .insert(artists)
        .values({
          userId,
          slug: `${slugify(input.name)}-${shortId()}`,
          region: input.region,
          name: input.name,
          category: input.category,
          city: input.city,
          hue: randomHue(),
          status: "pending",
          joinedYear: new Date().getFullYear(),
        })
        .returning({ id: artists.id });
      await tx.insert(artistPrivate).values({ artistId: artist.id, email: input.email });
    } else {
      const [venue] = await tx
        .insert(venues)
        .values({
          userId,
          region: input.region,
          businessName: input.business,
          type: input.venueType,
          contactName: input.name,
          city: input.city,
          hue: randomHue(),
        })
        .returning({ id: venues.id });
      await tx.insert(venuePrivate).values({ venueId: venue.id, email: input.email });
    }
  });
}
