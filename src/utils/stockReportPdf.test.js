import { describe, it, expect, vi, afterEach } from "vitest";
import { generateStockReportPdf } from "./stockReportPdf.js";

const shop = [
  { id: "1", name: "Beach Umbrella 20", category: "Beach Umbrella", qty: 5980, reorderLevel: 50, costPrice: 120, sellPrice: 180, unit: "pcs" },
  { id: "2", name: "Cadigan", category: "Sweaters", qty: 9750, reorderLevel: 50, costPrice: 90, sellPrice: 150, unit: "pcs" },
  { id: "3", name: "Girls Dresses", category: "Dresses", qty: 814, reorderLevel: 50, sellPrice: 0, unit: "pcs" },
  { id: "4", name: "Kids Nets Small", category: "Mosquito Nets", qty: 12, reorderLevel: 50, costPrice: 180, sellPrice: 300, unit: "pcs" },
];

const withSkus = shop.map((i, idx) => ({ ...i, sku: `SKU-${100 + idx}` }));

function generateQuietly(items) {
  // autoTable reports layout trouble through console.log rather than throwing,
  // so silence here is the actual assertion.
  const log = vi.spyOn(console, "log").mockImplementation(() => {});
  const doc = generateStockReportPdf({ storeName: "Enterprise", preparedBy: "Ernest", items, now: new Date("2026-09-14T13:45:00Z") });
  const messages = log.mock.calls.map((c) => c.join(" "));
  return { doc, messages };
}

afterEach(() => vi.restoreAllMocks());

describe("generateStockReportPdf", () => {
  it("lays out without autoTable complaining, for shops with no SKUs", () => {
    const { messages } = generateQuietly(shop);
    expect(messages).toEqual([]);
  });

  it("lays out cleanly when the SKU column is present too", () => {
    const { messages } = generateQuietly(withSkus);
    expect(messages).toEqual([]);
  });

  it("stays quiet on a shop big enough to run over several pages", () => {
    const many = Array.from({ length: 80 }, (_, i) => ({
      id: String(i),
      name: `A Deliberately Long Product Name Number ${i}`,
      category: ["Beach Umbrella", "Sweaters", "Mosquito Nets"][i % 3],
      qty: (i * 137) % 9000,
      reorderLevel: 50,
      costPrice: 40 + (i % 9) * 35,
      sellPrice: 70 + (i % 9) * 55,
      unit: "pcs",
    }));
    const { doc, messages } = generateQuietly(many);
    expect(messages).toEqual([]);
    expect(doc.getNumberOfPages()).toBeGreaterThan(1);
  });

  it("produces a real PDF document", () => {
    const { doc } = generateQuietly(shop);
    const out = doc.output("arraybuffer");
    expect(out.byteLength).toBeGreaterThan(1000);
    // PDF files start with the %PDF- signature.
    expect(String.fromCharCode(...new Uint8Array(out.slice(0, 5)))).toBe("%PDF-");
  });

  it("copes with an empty shop", () => {
    const { messages, doc } = generateQuietly([]);
    expect(messages).toEqual([]);
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
