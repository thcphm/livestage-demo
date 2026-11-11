import { requireRole } from "@/server/auth/session";
import { BuyerDashboard } from "@/components/dashboard/buyer-dashboard";

export default async function VenueDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const user = await requireRole("venue", "/dashboard/venue");
  return <BuyerDashboard user={user} tab={(await searchParams).tab} />;
}
