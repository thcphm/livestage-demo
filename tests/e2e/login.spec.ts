import { expect, test } from "@playwright/test";
import { SAMPLE_PASSWORD, logIn, resetSampleData } from "./helpers";

/*
 * Sign-in without the role picker: sample accounts log in with an email and password,
 * and the register form creates new accounts. Demo mode only (in-memory accounts).
 */
const demo = process.env.DEMO_MODE === "1" || !/^https:\/\/[\w.-]+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
test.skip(!demo, "Demo mode is off");
test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "ls_region", value: "ca", url: baseURL! }]);
});

test.afterAll(async ({ browser, baseURL }) => {
  await resetSampleData(browser, baseURL);
});

test("there is no role picker and no demo banner", async ({ page }) => {
  const res = await page.goto("/en/demo");
  expect(res?.status()).toBe(404);
  await page.goto("/en");
  await expect(page.getByText("Switch role")).toHaveCount(0);
  await expect(page.locator("header").getByRole("link", { name: "Log in" })).toBeVisible();
});

test("a wrong password is refused, the right one opens the dashboard, and log out ends the session", async ({ page }) => {
  await page.goto("/en/login");
  await page.locator("input[name=email]").fill("maple@demo.com");
  await page.locator("input[name=password]").fill("not-the-password");
  await page.locator("form button[type=submit]").click();
  await expect(page.getByText("Email or password is incorrect.")).toBeVisible();

  await page.locator("input[name=password]").fill(SAMPLE_PASSWORD);
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/dashboard\/venue/);
  await expect(page.getByRole("heading", { name: "The Maple Room" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto("/en/dashboard/venue");
  await expect(page).toHaveURL(/\/en\/login/);
});

test("each role lands on its own dashboard and cannot open another role's", async ({ page }) => {
  await logIn(page, "aria@demo.com", "/dashboard/artist");
  await page.goto("/en/dashboard/admin");
  await expect(page).toHaveURL(/\/en\/dashboard\/artist/);
});

test("a new individual client can sign up, is signed in, and can log in again", async ({ page }) => {
  await page.goto("/en/register?role=client");
  await page.locator("input[name=name]").fill("Test Client");
  await page.locator("input[name=email]").fill("new.client@example.com");
  await page.locator("input[name=password]").fill("a-new-password-1");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/dashboard\/client/);
  await expect(page.getByRole("heading", { name: "Test Client" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto("/en/login");
  await page.locator("input[name=email]").fill("new.client@example.com");
  await page.locator("input[name=password]").fill("a-new-password-1");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/dashboard\/client/);
});

test("a new venue and a new artist can sign up", async ({ page }) => {
  await page.goto("/en/register");
  await page.locator("input[name=business]").fill("Test Supper Club");
  await page.locator("input[name=name]").fill("Test Owner");
  await page.locator("input[name=email]").fill("new.venue@example.com");
  await page.locator("input[name=password]").fill("a-new-password-2");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/dashboard\/venue/);
  await expect(page.getByRole("heading", { name: "Test Supper Club" })).toBeVisible();

  await page.getByRole("button", { name: "Log out" }).click();
  await expect(page).toHaveURL(/\/en$/);
  await page.goto("/en/register?role=artist");
  await page.locator("input[name=name]").fill("Test Singer");
  await page.locator("input[name=email]").fill("new.artist@example.com");
  await page.locator("input[name=password]").fill("a-new-password-3");
  await page.locator("form button[type=submit]").click();
  await expect(page).toHaveURL(/\/en\/dashboard\/artist/);
  await page.goto("/en/artists/test-singer");
  await expect(page.getByRole("heading", { name: "Test Singer" })).toBeVisible();
});

test("an email that already has an account cannot sign up again", async ({ page }) => {
  await page.goto("/en/register?role=client");
  await page.locator("input[name=name]").fill("Someone Else");
  await page.locator("input[name=email]").fill("maple@demo.com");
  await page.locator("input[name=password]").fill("a-new-password-4");
  await page.locator("form button[type=submit]").click();
  await expect(page.getByText("This email already has an account. Please log in.")).toBeVisible();
});
