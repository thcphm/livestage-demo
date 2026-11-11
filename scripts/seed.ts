/**
 * Load the demo data (docs/demo/seed.json) into a DEVELOPMENT Supabase project:
 * auth users for all 27 demo accounts, profiles, artists and venues.
 * Safe to run again: rows are matched by their seed id and updated.
 *
 *   pnpm db:seed
 *
 * Every demo account gets the password in SEED_PASSWORD (never the demo's "123").
 */
import { readFileSync } from "node:fs";
import { eq } from "drizzle-orm";
import { artistBusyDates, artistMedia, artistPackages, artistPrivate, artists, profiles, venuePrivate, venues } from "../src/server/db/schema";
import { mapArtist, mapVenue, type SeedFile } from "../src/server/seed/map";
import { connect, listUsersByEmail, requireEnv, supabaseAdmin } from "./lib";

async function main() {
  const password = requireEnv("SEED_PASSWORD");
  if (password.length < 8) throw new Error("SEED_PASSWORD must be at least 8 characters.");
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed with NODE_ENV=production.");

  const seed: SeedFile = JSON.parse(readFileSync(new URL("../docs/demo/seed.json", import.meta.url), "utf8"));
  const admin = supabaseAdmin();
  const { db, close } = connect();
  console.log(`Seeding ${process.env.NEXT_PUBLIC_SUPABASE_URL} …`);

  // 1. Auth users (created confirmed, password reset to SEED_PASSWORD on every run).
  const existing = await listUsersByEmail(admin);
  const userIdByRef = new Map<string, string>();
  let adminUserIds: string[] = [];
  for (const acc of seed.accounts) {
    const email = acc.email.toLowerCase();
    let id = existing.get(email);
    if (id) {
      const { error } = await admin.auth.admin.updateUserById(id, { password, email_confirm: true });
      if (error) throw error;
    } else {
      const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { role: acc.role } });
      if (error) throw error;
      id = data.user.id;
    }
    if (acc.role === "admin") adminUserIds = [...adminUserIds, id];
    else if (acc.refId) userIdByRef.set(acc.refId, id);
  }
  console.log(`  ✓ ${seed.accounts.length} auth users`);

  // 2. Profiles, artists, venues in one transaction.
  await db.transaction(async (tx) => {
    const upsertProfile = (userId: string, role: "artist" | "venue" | "admin") =>
      tx.insert(profiles).values({ userId, role }).onConflictDoUpdate({ target: profiles.userId, set: { role } });

    for (const userId of adminUserIds) await upsertProfile(userId, "admin");

    for (const a of seed.artists) {
      const userId = userIdByRef.get(a.id);
      if (!userId) { console.warn(`  ! artist ${a.id} has no account, skipped`); continue; }
      await upsertProfile(userId, "artist");
      const m = mapArtist(a);
      const [row] = await tx.insert(artists).values({ ...m.artist, userId })
        .onConflictDoUpdate({ target: artists.seedRef, set: { ...m.artist, userId } })
        .returning({ id: artists.id });
      await tx.insert(artistPrivate).values({ artistId: row.id, ...m.priv })
        .onConflictDoUpdate({ target: artistPrivate.artistId, set: m.priv });
      await tx.delete(artistPackages).where(eq(artistPackages.artistId, row.id));
      await tx.delete(artistMedia).where(eq(artistMedia.artistId, row.id));
      await tx.delete(artistBusyDates).where(eq(artistBusyDates.artistId, row.id));
      if (m.packages.length) await tx.insert(artistPackages).values(m.packages.map((p) => ({ ...p, artistId: row.id })));
      if (m.media.length) await tx.insert(artistMedia).values(m.media.map((x) => ({ ...x, artistId: row.id })));
      if (m.busy.length) await tx.insert(artistBusyDates).values(m.busy.map((date) => ({ date, artistId: row.id })));
    }

    for (const v of seed.venues) {
      const userId = userIdByRef.get(v.id);
      if (!userId) { console.warn(`  ! venue ${v.id} has no account, skipped`); continue; }
      await upsertProfile(userId, "venue");
      const m = mapVenue(v);
      const [row] = await tx.insert(venues).values({ ...m.venue, userId })
        .onConflictDoUpdate({ target: venues.seedRef, set: { ...m.venue, userId } })
        .returning({ id: venues.id });
      await tx.insert(venuePrivate).values({ venueId: row.id, ...m.priv })
        .onConflictDoUpdate({ target: venuePrivate.venueId, set: m.priv });
    }
  });
  console.log(`  ✓ ${seed.artists.length} artists, ${seed.venues.length} venues, ${adminUserIds.length} admin`);
  console.log("Done. Log in with any demo email (e.g. jazz@demo.com) and SEED_PASSWORD.");
  await close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
