import React, { useState } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { C, inputStyle } from "../utils/tokens.js";
import { Button, Modal, Field } from "./ui.jsx";

function SupplierModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState(supplier || { name: "", contact: "", phone: "" });
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  return (
    <Modal title={supplier ? "Edit supplier" : "Add supplier"} onClose={onClose} width={380}>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Supplier name">
          <input style={inputStyle} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Kumasi Wholesale" />
        </Field>
        <Field label="Contact person">
          <input style={inputStyle} value={form.contact} onChange={(e) => set("contact", e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Phone">
          <input style={inputStyle} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="Optional" />
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="solid" disabled={!form.name.trim()} onClick={() => onSave(form)}>{supplier ? "Save changes" : "Add supplier"}</Button>
      </div>
    </Modal>
  );
}

export default function SuppliersTab({ suppliers, items, canDelete, onAdd, onUpdate, onDeleteRequest }) {
  const [showAdd, setShowAdd] = useState(false);
  const [editSupplier, setEditSupplier] = useState(null);

  const itemCount = (name) => items.filter((i) => i.supplierName === name).length;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
        <Button variant="solid" icon={Plus} onClick={() => setShowAdd(true)}>Add supplier</Button>
      </div>

      {suppliers.length === 0 ? (
        <div style={{ color: C.inkSoft, fontSize: 13.5, padding: "20px 0" }}>
          No suppliers yet. Add one, or they'll appear automatically as you type new supplier names on items.
        </div>
      ) : (
        <div style={{ background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, overflowX: "auto" }}>
          <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: C.panelAlt, textAlign: "left" }}>
                {["Supplier", "Contact", "Phone", "Items", ""].map((h) => (
                  <th key={h} style={{ padding: "10px 14px", color: C.inkSoft, fontWeight: 600, fontSize: 12 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => (
                <tr key={s.id} style={{ borderTop: `1px solid ${C.brownFaint}` }}>
                  <td style={{ padding: "10px 14px", fontWeight: 700, color: C.ink }}>{s.name}</td>
                  <td style={{ padding: "10px 14px", color: C.inkSoft }}>{s.contact || "—"}</td>
                  <td style={{ padding: "10px 14px", color: C.inkSoft }}>{s.phone || "—"}</td>
                  <td style={{ padding: "10px 14px", color: C.inkSoft }}>{itemCount(s.name)}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button title="Edit" onClick={() => setEditSupplier(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                        <Pencil size={14} color={C.inkSoft} />
                      </button>
                      {canDelete && (
                        <button title="Delete" onClick={() => onDeleteRequest(s)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                          <Trash2 size={14} color={C.inkSoft} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && (
        <SupplierModal onClose={() => setShowAdd(false)} onSave={(form) => { onAdd(form); setShowAdd(false); }} />
      )}
      {editSupplier && (
        <SupplierModal
          supplier={editSupplier}
          onClose={() => setEditSupplier(null)}
          onSave={(form) => { onUpdate(editSupplier.id, form); setEditSupplier(null); }}
        />
      )}
    </div>
  );
}
