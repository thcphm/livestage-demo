/* Shared setup for CLI scripts. Scripts run outside Next.js, so they must not import `server-only` modules. */
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../src/server/db/schema";

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing ${name}. Fill it in .env.local (see .env.example).`);
    process.exit(1);
  }
  return value;
}

export function connect() {
  const client = postgres(requireEnv("DATABASE_URL"), { prepare: false, max: 1 });
  return { db: drizzle(client, { schema }), close: () => client.end() };
}

export function supabaseAdmin() {
  return createClient(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), requireEnv("SUPABASE_SECRET_KEY"), {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

/** Map of lower-cased email → auth user id for every user in the project. */
export async function listUsersByEmail(admin: ReturnType<typeof supabaseAdmin>): Promise<Map<string, string>> {
  const byEmail = new Map<string, string>();
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    data.users.forEach((u) => u.email && byEmail.set(u.email.toLowerCase(), u.id));
    if (data.users.length < 1000) return byEmail;
  }
}
