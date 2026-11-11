import "server-only";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { serverEnv } from "../env";
import * as schema from "./schema";

function connect() {
  // Supabase's transaction pooler does not support prepared statements.
  const client = postgres(serverEnv().DATABASE_URL, { prepare: false, max: 5 });
  return drizzle(client, { schema });
}

type Db = ReturnType<typeof connect>;

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { db?: Db };

export function getDb(): Db {
  globalForDb.db ??= connect();
  return globalForDb.db;
}

export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
