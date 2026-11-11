import "server-only";
import { z } from "zod";

const schema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().startsWith("postgres"),
  NEXT_PUBLIC_SITE_URL: z.url().default("http://localhost:3000"),
});

let cached: z.infer<typeof schema> | undefined;

/** Server environment, validated on first use so a missing key fails with a clear message. */
export function serverEnv() {
  if (!cached) {
    const parsed = schema.safeParse(process.env);
    if (!parsed.success) {
      const keys = parsed.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Missing or invalid environment variables: ${keys}. Copy .env.example to .env.local and fill it in.`);
    }
    cached = parsed.data;
  }
  return cached;
}
