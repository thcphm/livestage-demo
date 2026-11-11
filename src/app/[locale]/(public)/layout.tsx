import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { getRegion } from "@/lib/region";
import { getSessionUser } from "@/server/auth/session";

// Pages depend on the visitor's region cookie and session (and the live demo data), so never prerender them.
export const dynamic = "force-dynamic";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const [region, user] = await Promise.all([getRegion(), getSessionUser()]);
  return (
    <div className="min-h-screen flex flex-col">
      <Header region={region} user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
