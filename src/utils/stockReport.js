// Shape and totals for the stock report. Kept free of jsPDF so the numbers
// can be tested without rendering a document.
import { effectiveCost } from "./costing.js";

export function stockReportRows(items) {
  return [...items]
    .sort(
      (a, b) =>
        String(a.category || "").localeCompare(String(b.category || "")) ||
        String(a.name || "").localeCompare(String(b.name || ""))
    )
    .map((i) => {
      const qty = Number(i.qty) || 0;
      const cost = effectiveCost(i);
      const sellPrice = Number(i.sellPrice) || 0;
      const reorderLevel = Number(i.reorderLevel) || 0;
      return {
        id: i.id,
        name: i.name || "Unnamed item",
        sku: i.sku || "",
        category: i.category || "General",
        supplierName: i.supplierName || "",
        unit: i.unit || "",
        qty,
        cost,
        sellPrice,
        reorderLevel,
        value: qty * cost,
        retail: qty * sellPrice,
        low: qty <= reorderLevel,
        shortfall: Math.max(0, reorderLevel - qty),
      };
    });
}

export function summariseStock(items) {
  const rows = stockReportRows(items);
  const totalValue = rows.reduce((s, r) => s + r.value, 0);
  const totalRetail = rows.reduce((s, r) => s + r.retail, 0);
  return {
    rows,
    itemCount: rows.length,
    totalUnits: rows.reduce((s, r) => s + r.qty, 0),
    totalValue,
    totalRetail,
    // What the stock would earn if it all sold at the current asking price.
    potentialProfit: totalRetail - totalValue,
    lowRows: rows.filter((r) => r.low),
    // Stock on the shelf with no cost recorded is invisible to the valuation,
    // so the report says so rather than quietly understating the total.
    missingCostCount: rows.filter((r) => r.qty > 0 && r.cost <= 0).length,
    hasSkus: rows.some((r) => r.sku),
  };
}
