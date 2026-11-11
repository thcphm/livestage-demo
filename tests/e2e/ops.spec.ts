import { expect, test, type Page } from "@playwright/test";
import { logIn, resetSampleData } from "./helpers";

/*
 * Walkthroughs of the features added after the 2026-11-07 meeting, on the demo data (Canada, English):
 * card surcharge, combo tickets, 50% guarantee, substitute artist, refunds, reservations widget,
 * group orders, platform rates and the operator roles.
 */
const demo = process.env.DEMO_MODE === "1" || !/^https:\/\/[\w.-]+$/.test(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "");
test.skip(!demo, "Demo mode is off");
test.describe.configure({ mode: "serial" });

const useAccount = (page: Page, name: string, next: string) => logIn(page, name, next);

test.beforeAll(async ({ browser, baseURL }) => {
  await resetSampleData(browser, baseURL);
});

test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([{ name: "ls_region", value: "ca", url: baseURL! }]);
});

test("N1 + N6: a combo ticket shows the service fee and the card surcharge", async ({ page }) => {
  await page.goto("/en/shows/ce3");
  await page.getByRole("radio", { name: /Dinner \+ show/ }).check();
  await page.getByLabel("Payment").selectOption("card");
  // 2 × $100 + 3% service fee, then 2.9% of $206 for paying by card.
  await expect(page.getByText("$211.97")).toBeVisible();
  await page.getByLabel("Payment").selectOption("interac");
  await expect(page.getByText("Credit card surcharge (2.9%)")).toHaveCount(0);
  await expect(page.getByText("$206", { exact: true })).toBeVisible();
  await page.getByLabel("Full name").fill("Combo Guest");
  await page.getByLabel("Email").fill("combo@example.com");
  await page.getByRole("button", { name: "Pay" }).click();
  await expect(page).toHaveURL(/\/en\/tickets\/LS-/, { timeout: 30_000 });
  await expect(page.getByText("Dinner + show")).toBeVisible();
});

test("N4: a show below 50% says how many tickets it still needs; one above is guaranteed", async ({ page }) => {
  await page.goto("/en/shows/ce3");
  await expect(page.getByText(/more tickets and the show is guaranteed/)).toBeVisible();
  await expect(page.getByText(/The venue decides by/)).toBeVisible();
  await page.goto("/en/shows/ce1");
  await expect(page.getByText("Guaranteed to go ahead").first()).toBeVisible();
});

test("N4: the venue replaces the artist and a ticket holder can take a refund", async ({ page }) => {
  await useAccount(page, "The Maple Room", "/dashboard/venue?tab=shows");
  const show = page.locator("section", { hasText: "Maya Chen – Soul Sessions" }).first();
  await show.getByLabel("Reason shown to guests").fill("Scheduling conflict");
  await show.getByRole("button", { name: "Replace artist" }).click();
  await expect(page.getByText(/replaced Maya Chen/)).toBeVisible();

  await page.goto("/en/shows/ce3");
  await expect(page.getByText("Line-up change")).toBeVisible();
  await expect(page.getByText(/in place of Maya Chen/)).toBeVisible();

  await page.goto("/en/tickets/LS-CE300");
  await page.getByRole("button", { name: "Refund this ticket" }).click();
  await expect(page.getByText(/^Refunded/)).toBeVisible();
});

test("N4: an under-sold show can be cancelled and every ticket is refunded", async ({ page }) => {
  await useAccount(page, "The Maple Room", "/dashboard/venue?tab=shows");
  const show = page.locator("section", { hasText: "Magic & Cocktails" }).first();
  await show.getByRole("button", { name: "Cancel show and refund" }).click();
  await expect(page.locator("section", { hasText: "Magic & Cocktails" })).toHaveCount(0);
  await page.goto("/en/shows/ce6");
  await expect(page.getByText("Show cancelled").first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Pay" })).toHaveCount(0);
});

test("N3: a guest books a table through the widget and the venue confirms it", async ({ page }) => {
  await page.goto("/en/embed/venue/v5/site");
  await expect(page.locator("iframe")).toHaveCount(1);

  await page.goto("/en/embed/venue/v5");
  await page.getByLabel("Full name").fill("Widget Guest");
  await page.getByLabel("Phone").fill("416 555 0100");
  await page.getByLabel("Email").fill("widget@example.com");
  await page.getByLabel("Date").fill("2026-11-12");
  await page.getByLabel("Time").fill("09:00");
  await page.getByRole("button", { name: "Request table" }).click();
  await expect(page.getByText("We take tables from 11:00 to 22:30.")).toBeVisible();
  await page.getByLabel("Time").fill("19:00");
  await page.getByLabel("Guests").fill("4");
  await page.getByRole("button", { name: "Request table" }).click();
  await expect(page.getByRole("heading", { name: "Reservation request sent" })).toBeVisible({ timeout: 30_000 });

  await useAccount(page, "The Maple Room", "/dashboard/venue?tab=reservations");
  const row = page.locator("li", { hasText: "Widget Guest" });
  await row.getByRole("button", { name: "Confirm" }).click();
  await expect(page.locator("li", { hasText: "Widget Guest" }).getByText("Confirmed")).toBeVisible();
});

test("N2: one group order for three artists, paid in one go", async ({ page }) => {
  await useAccount(page, "Sarah Mitchell", "/dashboard/bookings/o1-a");
  await expect(page.getByText("3 artists for this event")).toBeVisible();
  await expect(page.getByText("Pay all deposits at once")).toBeVisible();
  await page.getByRole("button", { name: /^Pay \$/ }).click();
  await expect(page.getByText("Confirmed").first()).toBeVisible();
  await page.goto("/en/dashboard/bookings/o1-b");
  await expect(page.getByText(/Deposit .* paid/)).toBeVisible();
});

test("N5 + N9: support staff can read the rates, only a super admin changes them", async ({ page }) => {
  await useAccount(page, "Chloe Martin", "/dashboard/admin?tab=rates");
  await expect(page.locator("input[name=customerBps]")).toBeDisabled();
  await expect(page.getByText(/only a super admin can change them/)).toBeVisible();

  await useAccount(page, "Linh Tran", "/dashboard/admin?tab=rates");
  await page.locator("input[name=customerBps]").fill("5");
  await page.getByRole("button", { name: "Save" }).click();
  await page.goto("/en/shows/ce1");
  await expect(page.getByText("Service fee (5%)")).toBeVisible();
  await page.goto("/en/dashboard/admin?tab=team");
  await expect(page.getByText("Sophie Laurent")).toBeVisible();
});

test("N8: a recruitment manager works leads and cannot open admin", async ({ page }) => {
  await useAccount(page, "Daniel Reyes", "/dashboard/recruiter");
  await page.goto("/en/dashboard/recruiter?tab=add");
  await page.locator("input[name=name]").fill("Harbourfront Jazz Agency");
  await page.locator("select[name=kind]").selectOption("agency");
  await page.getByRole("button", { name: "Add lead" }).click();
  await page.goto("/en/dashboard/recruiter");
  const lead = page.locator("li", { hasText: "Harbourfront Jazz Agency" });
  await lead.locator("select[name=status]").selectOption("signed");
  await lead.getByRole("button", { name: "Update" }).click();
  await expect(page.locator("li", { hasText: "Harbourfront Jazz Agency" }).getByText("Signed").first()).toBeVisible();
  await page.goto("/en/dashboard/admin");
  await expect(page).toHaveURL(/\/dashboard\/recruiter/);
});

test("N9: an artist manager quotes for an artist on the roster, and only for them", async ({ page }) => {
  await useAccount(page, "Sophie Laurent", "/dashboard/manager");
  await expect(page.getByText("DJ Sol")).toBeVisible();
  await page.goto("/en/dashboard/bookings/o1-c");
  await page.getByPlaceholder(/Fee/).fill("700");
  await page.getByRole("button", { name: "Send quote" }).click();
  await expect(page.getByText("$700").first()).toBeVisible();
  await page.goto("/en/dashboard/bookings/w1");
  await expect(page.getByText("Nguyễn Thu Hà")).toHaveCount(0);
});

test("dark mode: the header switch turns the page dark and remembers it", async ({ page }) => {
  await page.goto("/en");
  await page.getByRole("button", { name: "Dark mode" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: "Light mode" }).click();
  await expect(page.locator("html")).not.toHaveAttribute("data-theme", "dark");
});
