import type { Browser, Page } from "@playwright/test";

/** Password shared by the bundled sample accounts (see src/demo/auth.ts). */
export const SAMPLE_PASSWORD = process.env.DEMO_PASSWORD || "livestage2026";

/** Sample accounts the walkthroughs refer to by name. */
const EMAILS: Record<string, string> = {
  "Linh Tran": "admin@demo.com",
  "Chloe Martin": "support2@demo.com",
  "Daniel Reyes": "recruit.ca@demo.com",
  "Sophie Laurent": "northline@demo.com",
  "The Maple Room": "maple@demo.com",
  "Sarah Mitchell": "sarah@demo.com",
};

/** Logs in as a sample account (by email or by the names above) and lands on `next`. */
export async function logIn(page: Page, account: string, next: string, locale: "en" | "vi" = "en"): Promise<void> {
  const email = EMAILS[account] ?? account;
  await page.context().clearCookies({ name: "ls_demo_account" });
  await page.goto(`/${locale}/login?next=${encodeURIComponent(next)}`);
  await page.locator("input[name=email]").fill(email);
  await page.locator("input[name=password]").fill(SAMPLE_PASSWORD);
  await page.locator("form button[type=submit]").click();
  await page.waitForURL(new RegExp(next.replace(/[?]/g, "\\?")));
}

/** Puts the sample data back to its initial state, as a super admin. */
export async function resetSampleData(browser: Browser, baseURL: string | undefined): Promise<void> {
  const page = await browser.newPage({ baseURL });
  await logIn(page, "Linh Tran", "/dashboard/admin?tab=team");
  await page.getByRole("button", { name: "Reset sample data" }).click();
  await page.waitForLoadState("networkidle");
  await page.close();
}
