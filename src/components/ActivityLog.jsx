import React from "react";
import { C } from "../utils/tokens.js";

export default function ActivityLog({ transactions }) {
  const label = { in: "Stock in", out: "Stock out", initial: "Initial stock", adjust: "Adjustment" };
  const color = { in: C.green, out: C.rust, initial: C.brownMid, adjust: C.goldDeep };
  if (!transactions.length) return <div style={{ color: C.inkSoft, fontSize: 13.5 }}>No activity yet.</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {transactions.map((t) => (
        <div key={t.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 10, padding: "10px 14px" }}>
          <div>
            <span style={{ fontWeight: 700, color: color[t.type] || C.ink, fontSize: 12.5 }}>{label[t.type] || t.type}</span>
            <span style={{ marginLeft: 8, color: C.ink, fontSize: 13.5 }}>{t.itemName}</span>
            {t.note && <span style={{ marginLeft: 8, color: C.inkSoft, fontSize: 12 }}>{"—"} {t.note}</span>}
            {t.byName && <div style={{ color: C.inkSoft, fontSize: 11, marginTop: 2 }}>by {t.byName}</div>}
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{t.type === "out" ? "−" : "+"}{t.qty}</div>
            <div style={{ fontSize: 11, color: C.inkSoft }}>{new Date(t.date).toLocaleString()}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
