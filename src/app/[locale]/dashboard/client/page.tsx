import { requireRole } from "@/server/auth/session";
import { BuyerDashboard } from "@/components/dashboard/buyer-dashboard";

/** Individual clients booking for a party or ceremony (R1). */
export default async function ClientDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireRole("client", "/dashboard/client");
  return <BuyerDashboard user={user} tab={(await searchParams).tab} />;
}
