import React, { useState } from "react";
import { inputStyle, C } from "../utils/tokens.js";
import { Modal, Field, Button } from "./ui.jsx";

export default function MovementModal({ item, type, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const isIn = type === "in";
  const exceedsOnHand = !isIn && qty > item.qty;

  return (
    <Modal title={`${isIn ? "Stock in" : "Stock out"}: ${item.name}`} onClose={onClose} width={380}>
      <div style={{ fontSize: 13, color: "#6B5844", marginBottom: 14 }}>Currently {item.qty} {item.unit} on hand.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label={`Quantity ${isIn ? "received" : "taken"}`}>
          <input
            type="number"
            min="0"
            max={isIn ? undefined : item.qty}
            style={{ ...inputStyle, borderColor: exceedsOnHand ? C.rust : inputStyle.border }}
            value={qty}
            onChange={(e) => setQty(parseFloat(e.target.value) || 0)}
          />
        </Field>
        {exceedsOnHand && (
          <div style={{ background: C.rustSoft, color: C.rust, padding: "8px 12px", borderRadius: 8, fontSize: 12.5 }}>
            Only {item.qty} {item.unit} on hand — you can't take out more than that. If a count is wrong, edit the item's quantity directly instead.
          </div>
        )}
        <Field label="Note (optional)">
          <input style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder={isIn ? "e.g. Delivery from supplier" : "e.g. Sold to customer"} />
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="solid" disabled={qty <= 0 || exceedsOnHand} onClick={() => onConfirm(qty, note)}>{isIn ? "Add stock" : "Remove stock"}</Button>
      </div>
    </Modal>
  );
}
