import { expect, test } from "@playwright/test";

// These run without Supabase configured (the app is then in demo mode).

test.describe("Vietnamese browser", () => {
  test.use({ locale: "vi-VN" });

  test("still opens in English by default and switches to Vietnamese", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/\/en$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Book live music for your room");

    await page.getByRole("button", { name: "Language and region" }).click();
    await page.getByRole("button", { name: "Tiếng Việt" }).click();
    // The first visit to /vi compiles the page in dev, which can take a while.
    await expect(page).toHaveURL(/\/vi$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Đặt nhạc sống cho không gian của bạn");
  });
});

test("the default region is Canada", async ({ page }) => {
  await page.goto("/en/shows");
  await expect(page.getByText("Ticketed shows in Canada")).toBeVisible();
});

test("dashboard asks you to log in first", async ({ page }) => {
  await page.goto("/vi/dashboard/venue");
  await expect(page).toHaveURL(/\/vi\/login/);
});

test("register form shows field errors in the page language", async ({ page }) => {
  await page.goto("/en/register?role=venue");
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Password").fill("short");
  await page.getByRole("button", { name: "Register venue" }).click();
  await expect(page.getByText("Enter a valid email.")).toBeVisible();
  await expect(page.getByText("Password needs at least 8 characters.")).toBeVisible();
  await expect(page.getByText("This field is required.").first()).toBeVisible();
});
