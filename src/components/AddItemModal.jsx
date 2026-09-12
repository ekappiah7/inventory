import React, { useState } from "react";
import { inputStyle, C } from "../utils/tokens.js";
import { Modal, Field, Button } from "./ui.jsx";

export default function AddItemModal({ item, suppliers = [], onClose, onSave }) {
  const [form, setForm] = useState(
    item || {
      name: "", sku: "", category: "General", qty: 0, reorderLevel: 5, unit: "pcs", costPrice: 0, sellPrice: 0, supplierName: "",
    }
  );
  const [newSupplier, setNewSupplier] = useState(false);
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  return (
    <Modal title={item ? "Edit item" : "Add item"} onClose={onClose}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Item name">
            <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Basmati Rice 5kg" />
          </Field>
        </div>
        <Field label="SKU / code"><input style={inputStyle} value={form.sku} onChange={(e) => set("sku", e.target.value)} /></Field>
        <Field label="Category"><input style={inputStyle} value={form.category} onChange={(e) => set("category", e.target.value)} /></Field>
        <Field label="Starting quantity"><input type="number" style={inputStyle} value={form.qty} onChange={(e) => set("qty", parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Unit"><input style={inputStyle} value={form.unit} onChange={(e) => set("unit", e.target.value)} placeholder="bag, tin, pcs…" /></Field>
        <Field label="Reorder level"><input type="number" style={inputStyle} value={form.reorderLevel} onChange={(e) => set("reorderLevel", parseFloat(e.target.value) || 0)} /></Field>

        <div style={{ gridColumn: "1 / -1" }}>
          <Field label="Supplier">
            {newSupplier || !suppliers.length ? (
              <input
                style={inputStyle}
                value={form.supplierName}
                onChange={(e) => set("supplierName", e.target.value)}
                placeholder="Type a new supplier name"
              />
            ) : (
              <select
                style={inputStyle}
                value={suppliers.some((s) => s.name === form.supplierName) ? form.supplierName : ""}
                onChange={(e) => {
                  if (e.target.value === "__new__") { setNewSupplier(true); set("supplierName", ""); }
                  else set("supplierName", e.target.value);
                }}
              >
                <option value="">No supplier</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.name}>{s.name}</option>
                ))}
                <option value="__new__">+ Add a new supplier…</option>
              </select>
            )}
            {newSupplier && (
              <button
                type="button"
                onClick={() => setNewSupplier(false)}
                style={{ marginTop: 4, background: "none", border: "none", color: C.brownMid, fontSize: 11.5, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start" }}
              >
                Choose from existing suppliers instead
              </button>
            )}
          </Field>
        </div>

        <Field label="Cost price (GH₵)"><input type="number" style={inputStyle} value={form.costPrice} onChange={(e) => set("costPrice", parseFloat(e.target.value) || 0)} /></Field>
        <Field label="Sell price (GH₵)"><input type="number" style={inputStyle} value={form.sellPrice} onChange={(e) => set("sellPrice", parseFloat(e.target.value) || 0)} /></Field>

        {item && (
          <div style={{ gridColumn: "1 / -1" }}>
            <Field label="Average cost of stock on hand (GH₵)">
              <input
                type="number"
                step="0.01"
                style={inputStyle}
                value={form.avgCost ?? form.costPrice ?? 0}
                onChange={(e) => set("avgCost", parseFloat(e.target.value) || 0)}
              />
            </Field>
            <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 4, lineHeight: 1.45 }}>
              Recalculated automatically each time you record a delivery, and used to work out profit. Only change it by hand if
              it's wrong, for example when you're setting up stock you bought before using this app.
            </div>
          </div>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="solid" disabled={!form.name} onClick={() => onSave(form)}>{item ? "Save changes" : "Add item"}</Button>
      </div>
    </Modal>
  );
}
