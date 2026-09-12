import React, { useState } from "react";
import { inputStyle, C } from "../utils/tokens.js";
import { Modal, Field, Button } from "./ui.jsx";

const OUT_REASONS = [
  { value: "sale", label: "Sold to customer" },
  { value: "waste", label: "Damaged, expired, or lost" },
  { value: "adjustment", label: "Other adjustment" },
];
const IN_REASONS = [
  { value: "purchase", label: "Purchased from supplier" },
  { value: "return", label: "Customer return" },
  { value: "adjustment", label: "Other adjustment (e.g. count correction)" },
];

export default function MovementModal({ item, type, onClose, onConfirm }) {
  const [qty, setQty] = useState(1);
  const [note, setNote] = useState("");
  const [reason, setReason] = useState(type === "in" ? "purchase" : "sale");
  const [unitCost, setUnitCost] = useState(item.costPrice || 0);
  const isIn = type === "in";
  const exceedsOnHand = !isIn && qty > item.qty;
  const reasons = isIn ? IN_REASONS : OUT_REASONS;
  const isPurchase = isIn && reason === "purchase";

  return (
    <Modal title={`${isIn ? "Stock in" : "Stock out"}: ${item.name}`} onClose={onClose} width={380}>
      <div style={{ fontSize: 13, color: "#6B5844", marginBottom: 14 }}>Currently {item.qty} {item.unit} on hand.</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <Field label="Reason">
          <select style={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)}>
            {reasons.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </Field>
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
        {isPurchase && (
          <Field label="Cost per unit on this delivery (GH₵)">
            <input
              type="number"
              min="0"
              step="0.01"
              style={inputStyle}
              value={unitCost}
              onChange={(e) => setUnitCost(parseFloat(e.target.value) || 0)}
            />
          </Field>
        )}
        <Field label="Note (optional)">
          <input style={inputStyle} value={note} onChange={(e) => setNote(e.target.value)} placeholder={isIn ? "e.g. Delivery from supplier" : "e.g. Sold to customer"} />
        </Field>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button
          variant="solid"
          disabled={qty <= 0 || exceedsOnHand}
          onClick={() => onConfirm(qty, note, reason, isPurchase ? unitCost : undefined)}
        >
          {isIn ? "Add stock" : "Remove stock"}
        </Button>
      </div>
    </Modal>
  );
}
