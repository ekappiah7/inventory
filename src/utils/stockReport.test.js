import { describe, it, expect } from "vitest";
import { stockReportRows, summariseStock } from "./stockReport.js";

const items = [
  { id: "a", name: "Mosquito Nets", category: "Nets", qty: 10, reorderLevel: 50, costPrice: 300, sellPrice: 500, unit: "pcs" },
  { id: "b", name: "Cadigan", category: "Sweaters", qty: 100, avgCost: 90, sellPrice: 150, reorderLevel: 50, unit: "pcs" },
  { id: "c", name: "Girls Dresses", category: "Dresses", qty: 20, sellPrice: 0, reorderLevel: 5, unit: "pcs" },
];

describe("stockReportRows", () => {
  it("values each line at quantity times cost", () => {
    const rows = stockReportRows(items);
    const cadigan = rows.find((r) => r.name === "Cadigan");
    expect(cadigan.value).toBe(9000);
    expect(cadigan.retail).toBe(15000);
  });

  it("sorts by category then name so the sheet reads like a stock take", () => {
    expect(stockReportRows(items).map((r) => r.category)).toEqual(["Dresses", "Nets", "Sweaters"]);
  });

  it("flags lines at or below their reorder level with the shortfall", () => {
    const nets = stockReportRows(items).find((r) => r.name === "Mosquito Nets");
    expect(nets.low).toBe(true);
    expect(nets.shortfall).toBe(40);
  });

  it("treats stock with no cost as worth nothing rather than guessing", () => {
    const dresses = stockReportRows(items).find((r) => r.name === "Girls Dresses");
    expect(dresses.cost).toBe(0);
    expect(dresses.value).toBe(0);
  });

  it("copes with items missing most of their fields", () => {
    const [row] = stockReportRows([{ id: "x" }]);
    expect(row).toMatchObject({ name: "Unnamed item", category: "General", qty: 0, value: 0, retail: 0 });
  });
});

describe("summariseStock", () => {
  it("totals value and retail across the shop", () => {
    const s = summariseStock(items);
    expect(s.itemCount).toBe(3);
    expect(s.totalUnits).toBe(130);
    expect(s.totalValue).toBe(3000 + 9000); // dresses contribute nothing, no cost
    expect(s.totalRetail).toBe(5000 + 15000 + 0);
    expect(s.potentialProfit).toBe(8000);
  });

  it("counts stocked lines with no cost so the report can explain the gap", () => {
    expect(summariseStock(items).missingCostCount).toBe(1);
  });

  it("does not count empty shelves as a missing cost problem", () => {
    expect(summariseStock([{ id: "z", name: "Sold out", qty: 0 }]).missingCostCount).toBe(0);
  });

  it("collects the restock lines", () => {
    expect(summariseStock(items).lowRows.map((r) => r.name)).toEqual(["Mosquito Nets"]);
  });

  it("reports whether any SKUs exist, so the column can be dropped when unused", () => {
    expect(summariseStock(items).hasSkus).toBe(false);
    expect(summariseStock([{ id: "a", name: "X", sku: "GR-1" }]).hasSkus).toBe(true);
  });

  it("handles an empty shop", () => {
    const s = summariseStock([]);
    expect(s).toMatchObject({ itemCount: 0, totalUnits: 0, totalValue: 0, totalRetail: 0, missingCostCount: 0 });
  });
});
