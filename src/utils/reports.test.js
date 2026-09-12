import { describe, it, expect } from "vitest";
import { isSale, summarise, profitTrend, topSellers, notSelling, needsRestock } from "./reports.js";

const sale = (over = {}) => ({
  type: "out", reason: "sale", qty: 2, unitPrice: 10, unitCost: 6,
  itemId: "a", itemName: "Rice", date: Date.parse("2026-09-01T10:00:00Z"), ...over,
});

describe("isSale", () => {
  it("accepts a stock-out recorded as a sale with price snapshots", () => {
    expect(isSale(sale())).toBe(true);
  });

  it("rejects waste, adjustments, stock-ins and initial stock", () => {
    expect(isSale(sale({ reason: "waste" }))).toBe(false);
    expect(isSale(sale({ reason: "adjustment" }))).toBe(false);
    expect(isSale(sale({ type: "in" }))).toBe(false);
    expect(isSale(sale({ type: "initial", reason: undefined }))).toBe(false);
  });

  it("rejects older entries that predate price snapshots", () => {
    expect(isSale(sale({ unitPrice: undefined }))).toBe(false);
    expect(isSale(sale({ unitCost: undefined }))).toBe(false);
  });
});

describe("summarise", () => {
  it("computes revenue, cost, profit and margin from sales only", () => {
    const s = summarise([
      sale(),                                    // 2 x 10 = 20 revenue, 12 cost
      sale({ qty: 1, unitPrice: 50, unitCost: 30 }), // 50 revenue, 30 cost
      sale({ reason: "waste", qty: 3, unitCost: 6 }), // excluded from revenue
      { type: "in", qty: 100, unitCost: 6, unitPrice: 10, date: 1 }, // excluded
    ]);
    expect(s.revenue).toBe(70);
    expect(s.cogs).toBe(42);
    expect(s.grossProfit).toBe(28);
    expect(s.margin).toBeCloseTo(40);
    expect(s.unitsSold).toBe(3);
  });

  it("counts waste at cost, separately from profit", () => {
    const s = summarise([sale({ reason: "waste", qty: 3, unitCost: 6 })]);
    expect(s.wasteCost).toBe(18);
    expect(s.revenue).toBe(0);
  });

  it("reports zero margin rather than dividing by zero with no sales", () => {
    const s = summarise([]);
    expect(s.margin).toBe(0);
    expect(s.grossProfit).toBe(0);
  });
});

describe("profitTrend", () => {
  it("buckets sales by day, oldest first", () => {
    const day1 = Date.parse("2026-09-01T08:00:00Z");
    const day2 = Date.parse("2026-09-02T08:00:00Z");
    const points = profitTrend([
      sale({ date: day2 }),
      sale({ date: day1 }),
      sale({ date: day1 + 3600000 }),
    ]);
    expect(points).toHaveLength(2);
    expect(points[0].at).toBeLessThan(points[1].at);
    expect(points[0].profit).toBe(16); // two sales of 4 profit each... 2*(10-6)=8 per sale
    expect(points[1].profit).toBe(8);
  });

  it("collapses days that share a week into one bucket", () => {
    const WEEK = 7 * 86400000;
    const weekStart = Math.floor(Date.parse("2026-09-01T08:00:00Z") / WEEK) * WEEK;
    const points = profitTrend(
      [sale({ date: weekStart + 86400000 }), sale({ date: weekStart + 3 * 86400000 })],
      { weekly: true }
    );
    expect(points).toHaveLength(1);
    expect(points[0].profit).toBe(16);
  });

  it("keeps separate weeks apart", () => {
    const WEEK = 7 * 86400000;
    const weekStart = Math.floor(Date.parse("2026-09-01T08:00:00Z") / WEEK) * WEEK;
    const points = profitTrend([sale({ date: weekStart + 86400000 }), sale({ date: weekStart + WEEK + 86400000 })], { weekly: true });
    expect(points).toHaveLength(2);
  });
});

describe("topSellers", () => {
  it("ranks items by revenue and sums their units", () => {
    const rows = topSellers([
      sale({ itemId: "a", itemName: "Rice", qty: 1, unitPrice: 10 }),
      sale({ itemId: "b", itemName: "Oil", qty: 1, unitPrice: 90 }),
      sale({ itemId: "a", itemName: "Rice", qty: 2, unitPrice: 10 }),
    ]);
    expect(rows[0]).toMatchObject({ label: "Oil", value: 90, units: 1 });
    expect(rows[1]).toMatchObject({ label: "Rice", value: 30, units: 3 });
  });
});

describe("notSelling", () => {
  const items = [
    { id: "a", name: "Rice", qty: 5, costPrice: 10, unit: "bag" },
    { id: "b", name: "Oil", qty: 2, costPrice: 50, unit: "bottle" },
    { id: "c", name: "Empty", qty: 0, costPrice: 10, unit: "tin" },
  ];

  it("lists stocked items with no sales, most money tied up first", () => {
    const rows = notSelling(items, [sale({ itemId: "a" })]);
    expect(rows.map((r) => r.label)).toEqual(["Oil"]);
    expect(rows[0].value).toBe(100);
  });

  it("ignores items that are out of stock anyway", () => {
    const rows = notSelling(items, []);
    expect(rows.map((r) => r.label)).not.toContain("Empty");
  });
});

describe("needsRestock", () => {
  it("flags items at or below their reorder level, worst shortfall first", () => {
    const rows = needsRestock([
      { id: "a", name: "Rice", qty: 20, reorderLevel: 5, unit: "bag" },
      { id: "b", name: "Oil", qty: 1, reorderLevel: 10, unit: "bottle" },
      { id: "c", name: "Sugar", qty: 5, reorderLevel: 5, unit: "pack" },
    ]);
    expect(rows.map((r) => r.label)).toEqual(["Oil", "Sugar"]);
  });
});
