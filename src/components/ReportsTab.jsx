import React, { useMemo, useState } from "react";
import { C, SERIF } from "../utils/tokens.js";
import { StatCard } from "./Dashboard.jsx";

const PERIODS = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
  { id: "all", label: "All time" },
];

const cardWrap = { background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, padding: "16px 18px" };
const sectionHeading = { fontFamily: SERIF, fontSize: 17, color: C.brownDark, marginBottom: 10 };

function EmptyNote({ children, positive }) {
  return (
    <div style={{ background: positive ? C.greenSoft : C.panelAlt, color: positive ? C.green : C.inkSoft, padding: "12px 16px", borderRadius: 10, fontSize: 13 }}>
      {children}
    </div>
  );
}

function HorizontalBars({ rows, valueLabel }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {rows.map((r) => (
        <div key={r.label}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12.5, marginBottom: 3 }}>
            <span style={{ fontWeight: 600, color: C.ink, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
            <span style={{ color: C.inkSoft, flexShrink: 0 }}>{valueLabel(r)}</span>
          </div>
          <div style={{ background: C.panelAlt, borderRadius: 6, height: 8, overflow: "hidden" }}>
            <div style={{ width: `${Math.max(2, (r.value / max) * 100)}%`, height: "100%", background: r.color || C.gold, borderRadius: 6 }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function DailyTrendChart({ days }) {
  const max = Math.max(1, ...days.map((d) => Math.abs(d.profit)));
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 110, borderBottom: `1px solid ${C.brownFaint}` }}>
        {days.map((d, idx) => (
          <div
            key={idx}
            title={`${d.key}: GH₵${d.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            style={{
              flex: 1, minWidth: 3,
              height: `${Math.max(2, (Math.abs(d.profit) / max) * 100)}%`,
              background: d.profit < 0 ? C.rust : C.green,
              borderRadius: "3px 3px 0 0",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.inkSoft, marginTop: 6 }}>
        <span>{days[0]?.key}</span>
        <span>{days[days.length - 1]?.key}</span>
      </div>
    </div>
  );
}

export default function ReportsTab({ items, transactions }) {
  const [period, setPeriod] = useState(30);

  const cutoff = period === "all" ? 0 : Date.now() - period * 86400000;
  const inRange = useMemo(() => transactions.filter((t) => t.date >= cutoff), [transactions, cutoff]);

  const sales = useMemo(
    () => inRange.filter((t) => t.type === "out" && t.reason === "sale" && typeof t.unitPrice === "number" && typeof t.unitCost === "number"),
    [inRange]
  );
  const waste = useMemo(() => inRange.filter((t) => t.type === "out" && t.reason === "waste"), [inRange]);

  const revenue = sales.reduce((s, t) => s + t.qty * t.unitPrice, 0);
  const cogs = sales.reduce((s, t) => s + t.qty * t.unitCost, 0);
  const grossProfit = revenue - cogs;
  const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;
  const unitsSold = sales.reduce((s, t) => s + t.qty, 0);
  const wasteCost = waste.reduce((s, t) => s + t.qty * (t.unitCost || 0), 0);

  const trend = useMemo(() => {
    const bucketMs = period !== "all" && period <= 45 ? 86400000 : 7 * 86400000;
    const buckets = new Map();
    for (const t of sales) {
      const key = Math.floor(t.date / bucketMs) * bucketMs;
      const entry = buckets.get(key) || { revenue: 0, cogs: 0 };
      entry.revenue += t.qty * t.unitPrice;
      entry.cogs += t.qty * t.unitCost;
      buckets.set(key, entry);
    }
    return Array.from(buckets.entries())
      .sort((a, b) => a[0] - b[0])
      .slice(-60)
      .map(([key, v]) => ({
        key: new Date(key).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
        profit: v.revenue - v.cogs,
      }));
  }, [sales, period]);

  const topSellers = useMemo(() => {
    const byItem = new Map();
    for (const t of sales) {
      const entry = byItem.get(t.itemId) || { label: t.itemName, value: 0, units: 0 };
      entry.value += t.qty * t.unitPrice;
      entry.units += t.qty;
      byItem.set(t.itemId, entry);
    }
    return Array.from(byItem.values()).sort((a, b) => b.value - a.value).slice(0, 6);
  }, [sales]);

  const notSelling = useMemo(() => {
    const soldItemIds = new Set(sales.map((t) => t.itemId));
    return items
      .filter((i) => i.qty > 0 && !soldItemIds.has(i.id))
      .map((i) => ({ label: i.name, value: i.qty * (i.costPrice || 0), qty: i.qty, unit: i.unit }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [items, sales]);

  const needsRestock = useMemo(() => {
    return items
      .filter((i) => i.qty <= i.reorderLevel)
      .map((i) => ({ label: i.name, value: Math.max(1, i.reorderLevel - i.qty), qty: i.qty, reorderLevel: i.reorderLevel, unit: i.unit }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [items]);

  const fmt = (n) => `GH₵${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            style={{
              fontSize: 12.5, fontWeight: 600, padding: "6px 12px", borderRadius: 20, cursor: "pointer",
              border: `1px solid ${period === p.id ? C.gold : C.brownFaint}`,
              background: period === p.id ? C.gold : "transparent",
              color: period === p.id ? C.brownDark : C.inkSoft,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 26 }}>
        <StatCard label="Revenue" value={fmt(revenue)} sub={`${unitsSold} unit${unitsSold === 1 ? "" : "s"} sold`} />
        <StatCard label="Cost of goods sold" value={fmt(cogs)} />
        <StatCard label="Gross profit" value={fmt(grossProfit)} accent={grossProfit >= 0 ? C.green : C.rust} sub={`${margin.toFixed(0)}% margin`} />
        <StatCard label="Lost to waste" value={fmt(wasteCost)} accent={wasteCost > 0 ? C.rust : C.green} />
      </div>

      <h3 style={sectionHeading}>Profit trend</h3>
      {trend.length === 0 ? (
        <EmptyNote>No sales recorded {period === "all" ? "yet" : `in the last ${period} days`}. Record stock-outs with reason "Sold to customer" to see this fill in.</EmptyNote>
      ) : (
        <div style={{ ...cardWrap, marginBottom: 26 }}>
          <DailyTrendChart days={trend} />
        </div>
      )}

      <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={sectionHeading}>Needs restock</h3>
          {needsRestock.length === 0 ? (
            <EmptyNote positive>Everything is above its reorder level.</EmptyNote>
          ) : (
            <div style={cardWrap}>
              <HorizontalBars
                rows={needsRestock.map((r) => ({ ...r, color: C.rust }))}
                valueLabel={(r) => `${r.qty}/${r.reorderLevel} ${r.unit}`}
              />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={sectionHeading}>Top sellers</h3>
          {topSellers.length === 0 ? (
            <EmptyNote>No sales recorded in this period.</EmptyNote>
          ) : (
            <div style={cardWrap}>
              <HorizontalBars rows={topSellers} valueLabel={(r) => `${fmt(r.value)} · ${r.units} sold`} />
            </div>
          )}
        </div>

        <div style={{ flex: 1, minWidth: 280 }}>
          <h3 style={sectionHeading}>Not selling</h3>
          {notSelling.length === 0 ? (
            <EmptyNote positive>Everything in stock has sold in this period.</EmptyNote>
          ) : (
            <div style={cardWrap}>
              <HorizontalBars
                rows={notSelling.map((r) => ({ ...r, color: C.goldDeep }))}
                valueLabel={(r) => `${r.qty} ${r.unit} tied up`}
              />
            </div>
          )}
        </div>
      </div>

      <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 22 }}>
        Based on the {transactions.length < 500 ? "full" : "most recent 500"} activity log entries. Only stock-outs recorded with reason "Sold to customer" count toward revenue and profit.
      </div>
    </div>
  );
}
