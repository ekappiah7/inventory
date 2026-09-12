import { describe, it, expect } from "vitest";
import { effectiveCost, weightedAverageCost, stockValue } from "./costing.js";

describe("effectiveCost", () => {
  it("prefers the blended average once an item has one", () => {
    expect(effectiveCost({ avgCost: 41.5, costPrice: 38 })).toBe(41.5);
  });

  it("falls back to the entered cost price for items predating averaging", () => {
    expect(effectiveCost({ costPrice: 38 })).toBe(38);
  });

  it("treats a missing item or missing prices as zero", () => {
    expect(effectiveCost(null)).toBe(0);
    expect(effectiveCost({})).toBe(0);
  });

  it("respects a genuine zero average rather than falling back", () => {
    expect(effectiveCost({ avgCost: 0, costPrice: 38 })).toBe(0);
  });
});

describe("weightedAverageCost", () => {
  it("blends a delivery into existing stock", () => {
    // 10 bags at 38 plus 10 bags at 45 averages to 41.50
    expect(
      weightedAverageCost({ currentQty: 10, currentAvgCost: 38, incomingQty: 10, incomingUnitCost: 45 })
    ).toBe(41.5);
  });

  it("weights by quantity, not by number of deliveries", () => {
    // 90 at 10 plus 10 at 20 sits near 11, not near 15
    expect(
      weightedAverageCost({ currentQty: 90, currentAvgCost: 10, incomingQty: 10, incomingUnitCost: 20 })
    ).toBe(11);
  });

  it("takes the delivery price outright when stock had run out", () => {
    expect(
      weightedAverageCost({ currentQty: 0, currentAvgCost: 38, incomingQty: 5, incomingUnitCost: 45 })
    ).toBe(45);
  });

  it("leaves the average alone when nothing is received", () => {
    expect(
      weightedAverageCost({ currentQty: 10, currentAvgCost: 38, incomingQty: 0, incomingUnitCost: 99 })
    ).toBe(38);
  });

  it("rounds to whole pesewas", () => {
    const avg = weightedAverageCost({ currentQty: 3, currentAvgCost: 10, incomingQty: 1, incomingUnitCost: 11 });
    expect(avg).toBe(10.25);
  });

  it("handles missing or negative inputs without producing nonsense", () => {
    expect(weightedAverageCost({ currentQty: undefined, currentAvgCost: undefined, incomingQty: 4, incomingUnitCost: 7 })).toBe(7);
    expect(weightedAverageCost({ currentQty: -5, currentAvgCost: -2, incomingQty: 2, incomingUnitCost: 6 })).toBe(6);
  });

  it("never returns NaN", () => {
    expect(
      weightedAverageCost({ currentQty: "x", currentAvgCost: "y", incomingQty: "z", incomingUnitCost: "w" })
    ).toBe(0);
  });
});

describe("stockValue", () => {
  it("values stock at blended cost, falling back where absent", () => {
    expect(stockValue([{ qty: 2, avgCost: 41.5 }, { qty: 3, costPrice: 10 }])).toBe(113);
  });

  it("is zero for an empty shop", () => {
    expect(stockValue([])).toBe(0);
  });
});
