import React from "react";
import { LayoutGrid, Package, History, Truck, Users, AlertTriangle, LogOut, BarChart3 } from "lucide-react";
import { C, SERIF } from "../utils/tokens.js";

export default function Sidebar({ tab, setTab, lowStockCount, storeName, displayName, role, onSignOut }) {
  const items = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
    { id: "inventory", label: "Inventory", icon: Package },
    { id: "reports", label: "Reports", icon: BarChart3 },
    { id: "suppliers", label: "Suppliers", icon: Truck },
    { id: "log", label: "Activity", icon: History },
    { id: "team", label: "Team", icon: Users },
  ];
  return (
    <div style={{ width: 220, background: C.brownDark, color: C.panel, display: "flex", flexDirection: "column", padding: "22px 16px", flexShrink: 0 }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 24, color: C.gold, lineHeight: 1 }}>Stockroom</div>
        <div style={{ fontSize: 11.5, color: C.brownSoft, marginTop: 4 }}>{storeName || "Inventory, kept simple"}</div>
      </div>
      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {items.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8,
              background: tab === t.id ? "rgba(200,153,46,0.16)" : "transparent",
              color: tab === t.id ? C.gold : C.brownFaint, border: "none", cursor: "pointer",
              fontSize: 13.5, fontWeight: 600, textAlign: "left",
            }}
          >
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </nav>

      {lowStockCount > 0 && (
        <div style={{ marginTop: 20, background: "rgba(168,70,47,0.18)", border: "1px solid rgba(168,70,47,0.4)", borderRadius: 10, padding: "10px 12px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#E7A392", fontSize: 12.5, fontWeight: 700 }}>
            <AlertTriangle size={14} /> {lowStockCount} item{lowStockCount > 1 ? "s" : ""} low
          </div>
          <div style={{ color: C.brownFaint, fontSize: 11.5, marginTop: 2 }}>Check the dashboard to restock.</div>
        </div>
      )}

      <div style={{ marginTop: "auto", paddingTop: 20, borderTop: "1px solid rgba(220,201,168,0.15)" }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: C.panel }}>{displayName}</div>
        <div style={{ fontSize: 11, color: C.brownSoft, marginBottom: 8, textTransform: "capitalize" }}>{role}</div>
        <button
          onClick={onSignOut}
          style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", color: C.brownFaint, fontSize: 12, cursor: "pointer", padding: 0 }}
        >
          <LogOut size={13} /> Sign out
        </button>
      </div>
    </div>
  );
}
