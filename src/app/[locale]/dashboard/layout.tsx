import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import type { Locale } from "@/lib/catalog";
import { getRegion } from "@/lib/region";
import { getSessionUser } from "@/server/auth/session";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

// Per-user pages: never prerender, even if a build runs without Supabase configured.
export const dynamic = "force-dynamic";

/** Every dashboard needs a signed-in user; each role's page then checks the role itself. */
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, region] = await Promise.all([getSessionUser(), getRegion()]);
  if (!user) redirect({ href: "/login?next=" + encodeURIComponent("/dashboard"), locale: (await getLocale()) as Locale });
  return (
    <div className="min-h-screen flex flex-col">
      <Header region={region} user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
