// Pure report maths, kept away from React and Firestore so it can be tested
// directly. Everything here takes plain arrays and returns plain values.
import { effectiveCost } from "./costing.js";

// A stock-out only counts as revenue when it was recorded as an actual sale
// and carries the price snapshot taken at the time it happened.
export function isSale(tx) {
  return (
    tx.type === "out" &&
    tx.reason === "sale" &&
    typeof tx.unitPrice === "number" &&
    typeof tx.unitCost === "number"
  );
}

export function summarise(transactions) {
  const sales = transactions.filter(isSale);
  const waste = transactions.filter((t) => t.type === "out" && t.reason === "waste");

  const revenue = sales.reduce((s, t) => s + t.qty * t.unitPrice, 0);
  const cogs = sales.reduce((s, t) => s + t.qty * t.unitCost, 0);
  const grossProfit = revenue - cogs;

  return {
    sales,
    revenue,
    cogs,
    grossProfit,
    margin: revenue > 0 ? (grossProfit / revenue) * 100 : 0,
    unitsSold: sales.reduce((s, t) => s + t.qty, 0),
    wasteCost: waste.reduce((s, t) => s + t.qty * (t.unitCost || 0), 0),
  };
}

// Groups sales into day or week buckets and returns profit per bucket,
// oldest first. Buckets with no sales are left out rather than drawn as zero.
export function profitTrend(sales, { weekly = false, maxBuckets = 60 } = {}) {
  const bucketMs = weekly ? 7 * 86400000 : 86400000;
  const buckets = new Map();
  for (const t of sales) {
    const key = Math.floor(t.date / bucketMs) * bucketMs;
    const entry = buckets.get(key) || { revenue: 0, cogs: 0 };
    entry.revenue += t.qty * t.unitPrice;
    entry.cogs += t.qty * t.unitCost;
    buckets.set(key, entry);
  }
  return Array.from(buckets.entries())
    .sort((a, b) => a[0] - b[0])
    .slice(-maxBuckets)
    .map(([key, v]) => ({ at: key, profit: v.revenue - v.cogs }));
}

export function topSellers(sales, limit = 6) {
  const byItem = new Map();
  for (const t of sales) {
    const entry = byItem.get(t.itemId) || { label: t.itemName, value: 0, units: 0 };
    entry.value += t.qty * t.unitPrice;
    entry.units += t.qty;
    byItem.set(t.itemId, entry);
  }
  return Array.from(byItem.values()).sort((a, b) => b.value - a.value).slice(0, limit);
}

// Stock sitting on the shelf that saw no sales in the period, worst first by
// how much money is tied up in it.
export function notSelling(items, sales, limit = 8) {
  const soldItemIds = new Set(sales.map((t) => t.itemId));
  return items
    .filter((i) => i.qty > 0 && !soldItemIds.has(i.id))
    .map((i) => ({ label: i.name, value: i.qty * effectiveCost(i), qty: i.qty, unit: i.unit }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}

export function needsRestock(items, limit = 8) {
  return items
    .filter((i) => i.qty <= i.reorderLevel)
    .map((i) => ({
      label: i.name,
      value: Math.max(1, i.reorderLevel - i.qty),
      qty: i.qty,
      reorderLevel: i.reorderLevel,
      unit: i.unit,
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
}
