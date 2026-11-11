"use server";

import { cookies } from "next/headers";
import { isRegionId } from "./catalog";
import { REGION_COOKIE } from "./region";

export async function setRegion(region: string): Promise<void> {
  if (!isRegionId(region)) throw new Error(`Unknown region "${region}"`);
  (await cookies()).set(REGION_COOKIE, region, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
}
