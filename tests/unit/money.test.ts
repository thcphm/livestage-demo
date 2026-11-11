import { describe, expect, it } from "vitest";
import { depositAmount, formatMoney, formatMoneyShort, toMajor, toMinor } from "@/lib/money";

// Intl may use narrow/non-breaking spaces; normalise them for readable assertions.
const norm = (s: string) => s.replace(/[  ]/g, " ");

describe("minor units", () => {
  it("VND has no minor unit", () => {
    expect(toMinor(3_500_000, "VND")).toBe(3_500_000);
    expect(toMajor(3_500_000, "VND")).toBe(3_500_000);
  });

  it("CAD is stored in cents", () => {
    expect(toMinor(12.5, "CAD")).toBe(1250);
    expect(toMinor(0.1 + 0.2, "CAD")).toBe(30);
    expect(toMajor(1250, "CAD")).toBe(12.5);
  });
});

describe("formatMoney", () => {
  it("formats VND like the demo", () => {
    expect(formatMoney(3_500_000, "VND", "vi")).toBe("3.500.000đ");
    expect(formatMoney(3_500_000, "VND", "en")).toBe("₫3,500,000");
  });

  it("formats CAD without cents when whole, with cents otherwise", () => {
    expect(formatMoney(50_000, "CAD", "en")).toBe("$500");
    expect(formatMoney(2_050, "CAD", "en")).toBe("$20.50");
    expect(norm(formatMoney(50_000, "CAD", "vi"))).toBe("500 CA$");
  });

  it("rejects non-integer amounts", () => {
    expect(() => formatMoney(10.5, "VND", "vi")).toThrow();
  });
});

describe("formatMoneyShort", () => {
  it("abbreviates VND in millions", () => {
    expect(formatMoneyShort(3_500_000, "VND", "vi")).toBe("3,5tr");
    expect(formatMoneyShort(3_500_000, "VND", "en")).toBe("₫3.5M");
  });

  it("keeps CAD as a full amount", () => {
    expect(formatMoneyShort(80_000, "CAD", "en")).toBe("$800");
  });
});

describe("depositAmount", () => {
  it("rounds to the nearest minor unit", () => {
    expect(depositAmount(15_500_000, 30)).toBe(4_650_000);
    expect(depositAmount(33_333, 30)).toBe(10_000);
  });
});
