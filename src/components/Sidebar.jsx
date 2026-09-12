import React from "react";
import { LayoutGrid, Package, History, Truck, Users, AlertTriangle, LogOut, BarChart3 } from "lucide-react";
import { C, SERIF } from "../utils/tokens.js";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "suppliers", label: "Suppliers", icon: Truck },
  { id: "log", label: "Activity", icon: History },
  { id: "team", label: "Team", icon: Users },
];

function navButtonStyle(active, isNarrow) {
  return {
    display: "flex", alignItems: "center", gap: isNarrow ? 6 : 10,
    padding: isNarrow ? "7px 11px" : "9px 10px", borderRadius: 8,
    background: active ? "rgba(200,153,46,0.16)" : "transparent",
    color: active ? C.gold : C.brownFaint, border: "none", cursor: "pointer",
    fontSize: 13.5, fontWeight: 600, textAlign: "left", whiteSpace: "nowrap", flexShrink: 0,
  };
}

export default function Sidebar({ tab, setTab, lowStockCount, storeName, displayName, role, onSignOut, isNarrow }) {
  if (isNarrow) {
    return (
      <div style={{ background: C.brownDark, color: C.panel, padding: "12px 14px 0" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10 }}>
          <div style={{ minWidth: 0 }}>
            <span style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, color: C.gold }}>Stockroom</span>
            <span style={{ fontSize: 11.5, color: C.brownSoft, marginLeft: 8 }}>{storeName}</span>
          </div>
          <button
            onClick={onSignOut}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", color: C.brownFaint, fontSize: 11.5, cursor: "pointer", padding: 0, flexShrink: 0 }}
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>

        <div style={{ fontSize: 11, color: C.brownSoft, marginTop: 2 }}>
          {displayName} · <span style={{ textTransform: "capitalize" }}>{role}</span>
          {lowStockCount > 0 && <span style={{ color: "#E7A392", fontWeight: 700 }}> · {lowStockCount} low</span>}
        </div>

        <nav style={{ display: "flex", gap: 4, overflowX: "auto", marginTop: 10, paddingBottom: 8 }}>
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} style={navButtonStyle(tab === t.id, true)}>
              <t.icon size={14} /> {t.label}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div style={{ width: 220, background: C.brownDark, color: C.panel, display: "flex", flexDirection: "column", padding: "22px 16px", flexShrink: 0 }}>
      <div style={{ marginBottom: 30 }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 24, color: C.gold, lineHeight: 1 }}>Stockroom</div>
        <div style={{ fontSize: 11.5, color: C.brownSoft, marginTop: 4 }}>{storeName || "Inventory, kept simple"}</div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} style={navButtonStyle(tab === t.id, false)}>
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
