import React from "react";
import { ArrowUpCircle, ArrowDownCircle, Pencil, Trash2, Download, FileText } from "lucide-react";
import { C, iconBtn } from "../utils/tokens.js";
import { effectiveCost } from "../utils/costing.js";
import { Button } from "./ui.jsx";

export default function InventoryTable({ items, categories, category, setCategory, canDelete, onMove, onEdit, onDeleteRequest, onExport, onDownloadPdf }) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20, cursor: "pointer",
                border: `1px solid ${category === c ? C.gold : C.brownFaint}`,
                background: category === c ? C.gold : "transparent",
                color: category === c ? C.brownDark : C.inkSoft,
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="outline" icon={FileText} onClick={onDownloadPdf}>Stock report PDF</Button>
          <Button variant="outline" icon={Download} onClick={onExport}>Export CSV</Button>
        </div>
      </div>

      {items.length === 0 ? (
        <div style={{ color: C.inkSoft, fontSize: 13.5, padding: "20px 0" }}>No items match. Add one, or import a list.</div>
      ) : (
        <div style={{ background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 620, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.panelAlt, textAlign: "left" }}>
                {["Item", "Category", "On hand", "Reorder at", "Cost each", "Sells for", "", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", color: C.inkSoft, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((i) => {
                const low = i.qty <= i.reorderLevel;
                const cost = effectiveCost(i);
                return (
                  <tr key={i.id} style={{ borderTop: `1px solid ${C.brownFaint}` }}>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ fontWeight: 700, color: C.ink }}>{i.name}</div>
                      <div style={{ fontSize: 11.5, color: C.inkSoft }}>{i.sku || "No SKU"} {i.supplierName ? `· ${i.supplierName}` : ""}</div>
                    </td>
                    <td style={{ padding: "10px 14px", color: C.inkSoft }}>{i.category}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{ fontWeight: 700, color: low ? C.rust : C.ink }}>{i.qty}</span>
                      <span style={{ color: C.inkSoft, fontSize: 12 }}> {i.unit}</span>
                      {low && (
                        <span style={{ marginLeft: 6, fontSize: 10.5, fontWeight: 700, color: C.rust, background: C.rustSoft, padding: "2px 6px", borderRadius: 6 }}>
                          LOW
                        </span>
                      )}
                    </td>
                    <td style={{ padding: "10px 14px", color: C.inkSoft }}>{i.reorderLevel} {i.unit}</td>
                    <td style={{ padding: "10px 14px", color: cost > 0 ? C.inkSoft : C.rust }}>
                      {cost > 0 ? `GH₵${cost}` : "Not set"}
                    </td>
                    <td style={{ padding: "10px 14px", color: C.inkSoft }}>GH₵{i.sellPrice || 0}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button title="Stock in" onClick={() => onMove(i, "in")} style={iconBtn}><ArrowUpCircle size={16} color={C.green} /></button>
                        <button title="Stock out" onClick={() => onMove(i, "out")} style={iconBtn}><ArrowDownCircle size={16} color={C.rust} /></button>
                      </div>
                    </td>
                    <td style={{ padding: "10px 14px" }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button title="Edit" onClick={() => onEdit(i)} style={iconBtn}><Pencil size={14} color={C.inkSoft} /></button>
                        {canDelete && (
                          <button title="Delete" onClick={() => onDeleteRequest(i)} style={iconBtn}><Trash2 size={14} color={C.inkSoft} /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
