import React from "react";
import { ArrowDownCircle } from "lucide-react";
import { C, SERIF } from "../utils/tokens.js";
import { Button } from "./ui.jsx";

export function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, padding: "16px 18px", flex: 1, minWidth: 150 }}>
      <div style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>{label}</div>
      <div style={{ fontFamily: SERIF, fontSize: 28, color: accent || C.brownDark, marginTop: 4 }}>{value}</div>
      {sub && <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

export default function Dashboard({ items, lowStock, totalValue, totalUnits, onRestock }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 26 }}>
        <StatCard label="Items tracked" value={items.length} />
        <StatCard label="Units on hand" value={totalUnits} />
        <StatCard label="Stock value" value={`GH₵${totalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} sub="At cost price" />
        <StatCard label="Needs restock" value={lowStock.length} accent={lowStock.length ? C.rust : C.green} />
      </div>

      <h3 style={{ fontFamily: SERIF, fontSize: 19, color: C.brownDark, marginBottom: 10 }}>Restock needed</h3>
      {lowStock.length === 0 ? (
        <div style={{ background: C.greenSoft, color: C.green, padding: "12px 16px", borderRadius: 10, fontSize: 13.5 }}>
          Everything is above its reorder level.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {[...lowStock]
            .sort((a, b) => (a.qty - a.reorderLevel) - (b.qty - b.reorderLevel))
            .map((i) => (
              <div key={i.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: C.panel, border: `1px solid ${C.rustSoft}`, borderRadius: 10, padding: "10px 14px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: C.ink, fontSize: 14 }}>{i.name}</div>
                  <div style={{ fontSize: 12, color: C.inkSoft }}>{i.qty} {i.unit} left · reorder at {i.reorderLevel} · {i.category}</div>
                </div>
                <Button variant="dark" icon={ArrowDownCircle} onClick={() => onRestock(i)}>Restock</Button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
