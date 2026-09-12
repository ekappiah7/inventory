import { describe, it, expect } from "vitest";
import { parseFreeformLine, normalizeRow, itemsToCsv } from "./parse.js";

describe("parseFreeformLine", () => {
  it("pulls a name and quantity out of the shapes people actually type", () => {
    expect(parseFreeformLine("Rice 5kg, 40")).toEqual({ name: "Rice 5kg", qty: 40 });
    expect(parseFreeformLine("Rice 5kg - 40")).toEqual({ name: "Rice 5kg", qty: 40 });
    expect(parseFreeformLine("Rice 5kg\t40")).toEqual({ name: "Rice 5kg", qty: 40 });
  });

  it("defaults quantity to zero when the line is only a name", () => {
    expect(parseFreeformLine("Rice 5kg")).toEqual({ name: "Rice 5kg", qty: 0 });
  });

  it("strips list numbering from the front of a name", () => {
    expect(parseFreeformLine("1. Rice 5kg, 40")).toEqual({ name: "Rice 5kg", qty: 40 });
  });

  it("skips blank lines", () => {
    expect(parseFreeformLine("   ")).toBeNull();
    expect(parseFreeformLine("")).toBeNull();
  });
});

describe("normalizeRow", () => {
  it("matches common header spellings regardless of case and spacing", () => {
    const row = normalizeRow({ "Item Name": "Rice", " QUANTITY ": "40", "Reorder Level": "15", "Cost Price": "GH₵38" });
    expect(row).toMatchObject({ name: "Rice", qty: 40, reorderLevel: 15, costPrice: 38 });
  });

  it("fills sensible defaults for anything missing", () => {
    const row = normalizeRow({ name: "Rice" });
    expect(row).toMatchObject({ qty: 0, reorderLevel: 5, unit: "pcs", category: "General", sku: "", supplierName: "" });
  });

  it("rejects rows with no recognisable name", () => {
    expect(normalizeRow({ qty: "10" })).toBeNull();
  });

  it("does not assign an id, since Firestore does that at write time", () => {
    expect(normalizeRow({ name: "Rice" })).not.toHaveProperty("id");
  });
});

describe("itemsToCsv", () => {
  it("writes a header plus one row per item", () => {
    const csv = itemsToCsv([{ name: "Rice", sku: "GR-1", category: "Grains", qty: 4, reorderLevel: 2, unit: "bag", costPrice: 38, sellPrice: 48, supplierName: "Kumasi" }]);
    const lines = csv.trim().split("\n");
    expect(lines[0]).toContain("Name,SKU,Category");
    expect(lines[1]).toBe("Rice,GR-1,Grains,4,2,bag,38,48,Kumasi");
  });

  it("quotes values containing commas or quotes so the file stays parseable", () => {
    const csv = itemsToCsv([{ name: 'Rice, "premium"', qty: 1 }]);
    expect(csv).toContain('"Rice, ""premium"""');
  });
});
