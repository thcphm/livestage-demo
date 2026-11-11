import { describe, expect, it } from "vitest";
import en from "@/messages/en.json";
import vi from "@/messages/vi.json";
import { CATEGORIES, CITIES, REGIONS } from "@/lib/catalog";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [k, v]) => {
    const key = prefix ? `${prefix}.${k}` : k;
    return typeof v === "string" ? { ...acc, [key]: v } : { ...acc, ...leaves(v, key) };
  }, {});
}

describe("translation files", () => {
  const viKeys = leaves(vi);
  const enKeys = leaves(en);

  it("have exactly the same keys in vi and en", () => {
    expect(Object.keys(enKeys).sort()).toEqual(Object.keys(viKeys).sort());
  });

  it("have no empty strings", () => {
    for (const [key, value] of [...Object.entries(viKeys), ...Object.entries(enKeys)]) {
      expect(value.trim(), key).not.toBe("");
    }
  });
});

describe("catalog", () => {
  it("assigns every region city to that region", () => {
    for (const r of Object.values(REGIONS)) {
      for (const c of r.cities) expect(CITIES[c].region).toBe(r.id);
    }
  });

  it("labels every category in both languages", () => {
    for (const c of CATEGORIES) {
      expect(c.name.vi && c.name.en && c.desc.vi && c.desc.en).toBeTruthy();
    }
  });
});
