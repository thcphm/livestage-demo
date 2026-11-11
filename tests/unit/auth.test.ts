import { describe, expect, it } from "vitest";
import { checkAccess, dashboardPath, safeNext } from "@/server/auth/access";
import { fieldErrors, loginSchema, registerSchema, slugify } from "@/server/auth/validation";

describe("checkAccess", () => {
  it("sends anonymous visitors to login and back afterwards", () => {
    expect(checkAccess(null, "venue", "/dashboard/venue")).toEqual({ ok: false, redirectTo: "/login?next=%2Fdashboard%2Fvenue" });
  });

  it("sends a user with another role to their own dashboard", () => {
    expect(checkAccess("artist", "venue", "/dashboard/venue")).toEqual({ ok: false, redirectTo: "/dashboard/artist" });
    expect(checkAccess("venue", "admin", "/dashboard/admin")).toEqual({ ok: false, redirectTo: "/dashboard/venue" });
  });

  it("lets the right role in", () => {
    expect(checkAccess("admin", "admin", "/dashboard/admin")).toEqual({ ok: true });
  });

  it("maps roles to dashboards", () => {
    expect(dashboardPath("venue")).toBe("/dashboard/venue");
  });
});

describe("safeNext", () => {
  it("keeps same-site relative paths", () => {
    expect(safeNext("/vi/dashboard", "/")).toBe("/vi/dashboard");
  });

  it("rejects open redirects", () => {
    for (const bad of ["//evil.com", "https://evil.com", "/\\evil.com", "evil", "", null, undefined, 42]) {
      expect(safeNext(bad, "/fallback")).toBe("/fallback");
    }
  });
});

const venue = {
  role: "venue", email: " Owner@Example.com ", password: "longenough", region: "vn", city: "hcm",
  name: "Lê Minh Quân", business: "The Jazz Corner", venueType: "bar",
};

describe("registerSchema", () => {
  it("accepts a valid venue and normalises the email", () => {
    const r = registerSchema.safeParse(venue);
    expect(r.success).toBe(true);
    expect(r.data?.email).toBe("owner@example.com");
  });

  it("accepts a valid artist", () => {
    const r = registerSchema.safeParse({ role: "artist", email: "a@b.co", password: "longenough", region: "ca", city: "tor", name: "Maya Chen", category: "singer" });
    expect(r.success).toBe(true);
  });

  it("rejects a city outside the chosen region", () => {
    const r = registerSchema.safeParse({ ...venue, region: "ca" });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!)).toMatchObject({ city: "cityRegion" });
  });

  it("returns translation keys for each invalid field", () => {
    const r = registerSchema.safeParse({ ...venue, email: "nope", password: "short", business: " " });
    expect(fieldErrors(r.error!)).toMatchObject({ email: "email", password: "passwordShort", business: "required" });
  });

  it("does not allow signing up as admin", () => {
    expect(registerSchema.safeParse({ ...venue, role: "admin" }).success).toBe(false);
  });

  it("rejects an unknown venue type", () => {
    expect(registerSchema.safeParse({ ...venue, venueType: "casino" }).success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("requires a password", () => {
    expect(fieldErrors(loginSchema.safeParse({ email: "a@b.co", password: "" }).error!)).toEqual({ password: "required" });
  });
});

describe("slugify", () => {
  it("strips Vietnamese diacritics", () => {
    expect(slugify("Lam Thảo Vy")).toBe("lam-thao-vy");
    expect(slugify("Đoàn Ảo thuật Đà Nẵng")).toBe("doan-ao-thuat-da-nang");
    expect(slugify("DJ K-Lite & Friends!")).toBe("dj-k-lite-friends");
  });

  it("never returns an empty slug", () => {
    expect(slugify("!!!")).toBe("artist");
  });
});
