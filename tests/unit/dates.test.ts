import { describe, expect, it } from "vitest";
import { formatDate, formatHours, formatShortDate, parseYmd, todayIn, toYmd } from "@/lib/dates";

describe("parseYmd", () => {
  it("round-trips a calendar date", () => {
    expect(toYmd(parseYmd("2026-11-06"))).toBe("2026-11-06");
  });

  it("rejects malformed or impossible dates", () => {
    expect(() => parseYmd("06/11/2026")).toThrow();
    expect(() => parseYmd("2026-02-30")).toThrow();
  });
});

describe("formatDate", () => {
  it("uses the demo's Vietnamese format", () => {
    expect(formatDate("2026-11-06", "vi")).toBe("T6, 06/11/2026");
    expect(formatDate("2026-11-08", "vi")).toBe("CN, 08/11/2026");
    expect(formatShortDate("2026-11-06", "vi")).toBe("06/11");
  });

  it("uses US English format", () => {
    expect(formatDate("2026-11-06", "en")).toBe("Fri, Nov 6, 2026");
    expect(formatShortDate("2026-11-06", "en")).toBe("Nov 6");
  });
});

describe("todayIn", () => {
  it("returns the calendar date in the city's time zone", () => {
    const instant = new Date("2026-10-30T20:00:00Z");
    expect(todayIn("Asia/Ho_Chi_Minh", instant)).toBe("2026-10-31");
    expect(todayIn("America/Vancouver", instant)).toBe("2026-10-30");
  });
});

it("formats durations", () => {
  expect(formatHours(3, "vi")).toBe("3 giờ");
  expect(formatHours(3, "en")).toBe("3 h");
});
