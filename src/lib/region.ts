import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_REGION, isRegionId, type RegionId } from "./catalog";

export const REGION_COOKIE = "ls_region";

/** Region chosen by the visitor (cookie), falling back to Canada. */
export async function getRegion(): Promise<RegionId> {
  const value = (await cookies()).get(REGION_COOKIE)?.value;
  return isRegionId(value) ? value : DEFAULT_REGION;
}
