import { expect, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

/*
 * Needs a DEVELOPMENT Supabase project in .env.local, with "Confirm email" turned off
 * and `pnpm db:seed` run (for the demo artist account). Users created here are deleted afterwards.
 */
// Placeholder values from .env.example ("https://<project-ref>.supabase.co") don't count.
const configured = /^https:\/\/[\w.-]+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "") && !!process.env.SUPABASE_SECRET_KEY && !!process.env.SEED_PASSWORD
  && process.env.DEMO_MODE !== "1";
test.skip(!configured, "Supabase dev project not configured in .env.local");

const runId = Date.now().toString(36);
const venueEmail = `e2e-venue-${runId}@example.com`;
const password = "e2e-password-123";

test.afterAll(async () => {
  if (!configured) return;
  const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!, { auth: { persistSession: false } });
  const { data } = await admin.auth.admin.listUsers({ perPage: 1000 });
  for (const u of data?.users ?? []) if (u.email?.startsWith(`e2e-`) && u.email.includes(runId)) await admin.auth.admin.deleteUser(u.id);
});

test("a venue can register, log out and log back in", async ({ page }) => {
  await page.goto("/vi/register?role=venue");
  await page.getByLabel("Khu vực").selectOption("vn");
  await page.getByLabel("Thành phố").selectOption("hn");
  await page.getByLabel("Tên nhà hàng").fill(`E2E Bistro ${runId}`);
  await page.getByLabel("Người đại diện").fill("Kiểm Thử");
  await page.getByLabel("Email").fill(venueEmail);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng ký nhà hàng" }).click();

  await expect(page).toHaveURL(/\/vi\/dashboard\/venue/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(`E2E Bistro ${runId}`);
  await expect(page.getByText("Nhà hàng · Hà Nội")).toBeVisible();

  // Same email again is refused.
  await page.context().clearCookies();
  await page.goto("/vi/register?role=venue");
  await page.getByLabel("Tên nhà hàng").fill("Duplicate");
  await page.getByLabel("Người đại diện").fill("Dup");
  await page.getByLabel("Email").fill(venueEmail);
  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng ký nhà hàng" }).click();
  await expect(page.getByText("Email này đã có tài khoản. Hãy đăng nhập.")).toBeVisible();

  await page.goto("/vi/login");
  await page.getByLabel("Email").fill(venueEmail);
  await page.getByLabel("Mật khẩu").fill("wrong-password");
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page.getByText("Email hoặc mật khẩu chưa đúng.")).toBeVisible();

  await page.getByLabel("Mật khẩu").fill(password);
  await page.getByRole("button", { name: "Đăng nhập", exact: true }).click();
  await expect(page).toHaveURL(/\/vi\/dashboard\/venue/);
});

test("roles cannot open each other's dashboards", async ({ page }) => {
  await page.goto("/en/login?next=/dashboard/venue");
  await page.getByLabel("Email").fill("thaovy@demo.com");
  await page.getByLabel("Password").fill(process.env.SEED_PASSWORD!);
  await page.getByRole("button", { name: "Log in", exact: true }).click();
  // The artist asked for the venue dashboard and is sent to their own.
  await expect(page).toHaveURL(/\/en\/dashboard\/artist/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Lam Thảo Vy");

  await page.goto("/en/dashboard/admin");
  await expect(page).toHaveURL(/\/en\/dashboard\/artist/);
});
