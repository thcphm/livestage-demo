import { expect, test, type Page } from "@playwright/test";
import { logIn, resetSampleData } from "./helpers";

/*
 * Walkthroughs of the meeting requirements (R1–R7) on the demo data.
 * Skipped when Supabase is configured and DEMO_MODE is off, because the demo store is then not used.
 */
const demo = process.env.DEMO_MODE === "1" || !/^https:\/\/[\w.-]+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
test.skip(!demo, "Demo mode is off");
test.use({ locale: "vi-VN" });
test.describe.configure({ mode: "serial" });

const useAccount = (page: Page, account: string, next: string) => logIn(page, account, next, "vi");

test.beforeAll(async ({ browser, baseURL }) => {
  await resetSampleData(browser, baseURL);
});

test("R3: a touring artist shows up in Hamilton only during the trip", async ({ page, context, baseURL }) => {
  await context.addCookies([{ name: "ls_region", value: "ca", url: baseURL! }]);
  await page.goto("/vi/artists?city=ham&date=2026-12-13");
  await expect(page.getByRole("link", { name: "Aria Benoit" }).first()).toBeVisible();
  await expect(page.getByText("Đang ở Hamilton ngày này")).toBeVisible();

  await page.goto("/vi/artists?city=ham&date=2026-12-20");
  await expect(page.getByRole("link", { name: "Aria Benoit" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Daniel Kwan" }).first()).toBeVisible();
});

test("R2: the public schedule hides private event details", async ({ page }) => {
  await page.goto("/vi/artists/aria-benoit");
  await expect(page.getByText("The Harbour Room").first()).toBeVisible();
  await expect(page.getByText("Sự kiện riêng, Hamilton")).toBeVisible();
  await expect(page.getByText(/Emily/)).toHaveCount(0);
});

test("R1 + R6 + R7 + R4: a client accepts, pays the deposit and contacts appear", async ({ page }) => {
  await useAccount(page, "thuha@demo.com", "/dashboard/bookings/w1");
  const messages = page.locator("#messages");
  await expect(messages.getByText("Đã ẩn thông tin liên hệ")).toBeVisible();
  await expect(messages).not.toContainText("0903 456 789");
  await expect(page.getByText("Perfect", { exact: true })).toBeVisible();
  await expect(page.getByText("Chờ bên đặt đồng ý")).toBeVisible();

  await page.getByRole("button", { name: "Chấp nhận báo giá" }).click();
  await page.getByRole("button", { name: /^Thanh toán/ }).click();
  await expect(page.getByText("Đã chốt").first()).toBeVisible();
  await expect(messages).toContainText("0903 456 789");
  await expect(page.getByText("0909 318 112")).toBeVisible();
  await expect(page.getByText("thaovy@demo.com")).toBeVisible();
});

test("R6: an artist accepts a song request with a fee, creating a new contract version", async ({ page }) => {
  await useAccount(page, "baonam@demo.com", "/dashboard/bookings/w3");
  await expect(page.getByText("Địa chỉ cụ thể hiện sau khi chốt")).toBeVisible();
  await page.getByPlaceholder(/Cát-xê/).fill("3000000");
  await page.getByRole("button", { name: "Gửi báo giá" }).click();
  await expect(page.getByText("Phiên bản 1")).toBeVisible();
  await page.getByPlaceholder(/Phí thêm/).fill("200000");
  await page.getByRole("button", { name: "Nhận bài" }).click();
  await expect(page.getByText("Phiên bản 2")).toBeVisible();
  await expect(page.getByText("3.200.000đ").first()).toBeVisible();
});

test("R4: only Olive sees the platform fee", async ({ page }) => {
  await useAccount(page, "Linh Tran", "/dashboard/bookings/w2");
  await expect(page.getByText("Chỉ Olive thấy")).toBeVisible();
  await useAccount(page, "aria@demo.com", "/dashboard/bookings/w2");
  await expect(page.getByText("Chỉ Olive thấy")).toHaveCount(0);
});

test("tickets: buy without an account and get a QR code", async ({ page }) => {
  await page.goto("/vi/shows/e1");
  await page.getByLabel("Họ tên").fill("Kiểm Thử");
  await page.getByLabel("Email").fill("kiemthu@example.com");
  await page.getByRole("button", { name: "Thanh toán" }).click();
  await expect(page).toHaveURL(/\/vi\/tickets\/LS-/, { timeout: 30_000 });
  await expect(page.locator("main svg").first()).toBeVisible();
});
