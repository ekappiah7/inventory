// Best-effort parser for freeform lines pulled out of a Word doc (or pasted text):
// "Rice 5kg, 40" / "Rice 5kg - 40" / "Rice 5kg" (defaults qty to 0).
export function parseFreeformLine(line) {
  const raw = line.trim();
  if (!raw) return null;
  const parts = raw
    .split(/\t|,(?!\d)|\s{2,}|-{1,2}(?=\s)|:(?=\s)/)
    .map((s) => s.trim())
    .filter(Boolean);
  let name = parts[0];
  let qty = 0;
  for (let i = 1; i < parts.length; i++) {
    const n = parseFloat(parts[i].replace(/[^\d.]/g, ""));
    if (!isNaN(n)) {
      qty = n;
      break;
    }
  }
  if (!name) return null;
  name = name.replace(/^[\d.\-*)\s]+/, "").trim();
  if (!name) return null;
  return { name, qty };
}

// Normalizes one row from a parsed CSV/XLSX sheet into an item, matching
// common header spellings so the user doesn't have to match an exact template.
// Does not assign an id or timestamps — those are set when the row is
// actually written to Firestore.
export function normalizeRow(row) {
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(row).find((rk) => rk.trim().toLowerCase() === k);
      if (found && row[found] !== undefined && row[found] !== "") return row[found];
    }
    return undefined;
  };
  const name = get("name", "item", "item name", "product", "description");
  if (!name) return null;
  const qtyRaw = get("qty", "quantity", "stock", "on hand", "count");
  const reorderRaw = get("reorder", "reorder level", "reorder point", "min stock", "minimum");
  const costRaw = get("cost", "cost price", "unit cost", "buying price");
  const sellRaw = get("price", "sell price", "selling price", "unit price");
  return {
    name: String(name).trim(),
    sku: get("sku", "code", "item code") ? String(get("sku", "code", "item code")).trim() : "",
    category: get("category", "type", "group") ? String(get("category", "type", "group")).trim() : "General",
    qty: qtyRaw !== undefined ? parseFloat(qtyRaw) || 0 : 0,
    reorderLevel: reorderRaw !== undefined ? parseFloat(reorderRaw) || 0 : 5,
    unit: get("unit", "uom") ? String(get("unit", "uom")).trim() : "pcs",
    costPrice: costRaw !== undefined ? parseFloat(String(costRaw).replace(/[^\d.]/g, "")) || 0 : 0,
    sellPrice: sellRaw !== undefined ? parseFloat(String(sellRaw).replace(/[^\d.]/g, "")) || 0 : 0,
    supplierName: get("supplier", "vendor") ? String(get("supplier", "vendor")).trim() : "",
  };
}

// Turns the current item list into a downloadable CSV (used for both the
// import template and exporting the live inventory).
export function itemsToCsv(items) {
  const header = ["Name", "SKU", "Category", "Qty", "Reorder Level", "Unit", "Cost Price", "Sell Price", "Supplier"];
  const escape = (v) => {
    const s = String(v ?? "");
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = items.map((i) => [
    i.name, i.sku || "", i.category || "", i.qty ?? 0, i.reorderLevel ?? 0, i.unit || "",
    i.costPrice ?? 0, i.sellPrice ?? 0, i.supplierName || "",
  ]);
  return [header, ...rows].map((r) => r.map(escape).join(",")).join("\n") + "\n";
}

export function downloadCsv(filename, csvText) {
  const blob = new Blob([csvText], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
