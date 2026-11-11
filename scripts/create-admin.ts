/**
 * Create (or promote) an Olive admin account. Admins cannot sign up through the site.
 *
 *   pnpm admin:create someone@olive.vn
 *
 * Prints a one-time link that lets the admin choose their own password; no password is typed here.
 */
import { randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { profiles } from "../src/server/db/schema";
import { connect, listUsersByEmail, supabaseAdmin } from "./lib";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();
  if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
    console.error("Usage: pnpm admin:create <email>");
    process.exit(1);
  }
  const site = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const admin = supabaseAdmin();
  const { db, close } = connect();

  let userId = (await listUsersByEmail(admin)).get(email);
  if (!userId) {
    const { data, error } = await admin.auth.admin.createUser({ email, password: randomBytes(24).toString("base64url"), email_confirm: true });
    if (error) throw error;
    userId = data.user.id;
  }

  const [existing] = await db.select({ role: profiles.role }).from(profiles).where(eq(profiles.userId, userId));
  if (existing && existing.role !== "admin") {
    console.error(`${email} is already a ${existing.role} account. Use a different email for the admin.`);
    process.exit(1);
  }
  if (!existing) await db.insert(profiles).values({ userId, role: "admin" });

  const { data, error } = await admin.auth.admin.generateLink({ type: "recovery", email });
  if (error) throw error;
  const link = `${site}/api/auth/callback?token_hash=${data.properties.hashed_token}&type=recovery&next=${encodeURIComponent("/vi/reset-password")}`;
  console.log(`Admin ready: ${email}`);
  console.log(`Send this one-time link to the admin to set a password (expires per your Supabase settings):\n${link}`);
  await close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
