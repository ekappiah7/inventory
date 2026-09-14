import React, { useEffect, useMemo, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "../firebase.js";
import { FileText } from "lucide-react";
import { C, SERIF } from "../utils/tokens.js";
import { Button } from "./ui.jsx";
import { StatCard } from "./Dashboard.jsx";
import { summarise, profitTrend, topSellers, notSelling, needsRestock } from "../utils/reports.js";

const PERIODS = [
  { id: 7, label: "7 days" },
  { id: 30, label: "30 days" },
  { id: 90, label: "90 days" },
  { id: "all", label: "All time" },
];

// Ceiling on how much history one report pulls. Far above what a small shop
// generates in a year, but stops an unbounded read if it ever grows.
const MAX_ROWS = 5000;

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

function TrendChart({ points }) {
  const max = Math.max(1, ...points.map((p) => Math.abs(p.profit)));
  const label = (at) => new Date(at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return (
    <div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 110, borderBottom: `1px solid ${C.brownFaint}` }}>
        {points.map((p) => (
          <div
            key={p.at}
            title={`${label(p.at)}: GH₵${p.profit.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
            style={{
              flex: 1, minWidth: 3,
              height: `${Math.max(2, (Math.abs(p.profit) / max) * 100)}%`,
              background: p.profit < 0 ? C.rust : C.green,
              borderRadius: "3px 3px 0 0",
            }}
          />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: C.inkSoft, marginTop: 6 }}>
        <span>{label(points[0].at)}</span>
        <span>{label(points[points.length - 1].at)}</span>
      </div>
    </div>
  );
}

export default function ReportsTab({ storeId, items, isNarrow, onDownloadStockPdf }) {
  const [period, setPeriod] = useState(30);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  // Reports read their own slice of history rather than the dashboard's live
  // feed, which only keeps the most recent 500 entries and would silently
  // under-report once a shop passes that.
  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError("");
    const base = collection(db, "stores", storeId, "transactions");
    const q =
      period === "all"
        ? query(base, orderBy("date", "desc"), limit(MAX_ROWS))
        : query(base, where("date", ">=", Date.now() - period * 86400000), orderBy("date", "desc"), limit(MAX_ROWS));
    getDocs(q)
      .then((snap) => {
        if (!cancelled) setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      })
      .catch(() => {
        if (!cancelled) {
          setRows([]);
          setError("Couldn't load report data. Check your connection and try again.");
        }
      });
    return () => { cancelled = true; };
  }, [storeId, period]);

  const stats = useMemo(() => summarise(rows || []), [rows]);
  const trend = useMemo(
    () => profitTrend(stats.sales, { weekly: period === "all" || period > 45 }),
    [stats.sales, period]
  );
  const sellers = useMemo(() => topSellers(stats.sales), [stats.sales]);
  const idle = useMemo(() => notSelling(items, stats.sales), [items, stats.sales]);
  const restock = useMemo(() => needsRestock(items), [items]);

  const fmt = (n) => `GH₵${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
  const loading = rows === null;

  return (
    <div>
      <div style={{ ...cardWrap, marginBottom: 22, display: "flex", gap: 14, alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
        <div style={{ minWidth: 220, flex: 1 }}>
          <div style={{ fontFamily: SERIF, fontSize: 17, color: C.brownDark, marginBottom: 4 }}>Stock report</div>
          <div style={{ fontSize: 12.5, color: C.inkSoft, lineHeight: 1.5 }}>
            Everything on the shelf right now with cost, selling price and value per line, totalled, with a restock list at the
            end. A printable PDF you can file, email, or hand to a bank.
          </div>
        </div>
        <Button variant="solid" icon={FileText} onClick={onDownloadStockPdf}>Download PDF</Button>
      </div>

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

      {error && (
        <div style={{ background: C.rustSoft, color: C.rust, padding: "8px 12px", borderRadius: 8, fontSize: 12.5, marginBottom: 16 }}>{error}</div>
      )}

      {loading ? (
        <div style={{ color: C.inkSoft, fontSize: 13.5, padding: "20px 0" }}>Working out the numbers…</div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 26 }}>
            <StatCard label="Revenue" value={fmt(stats.revenue)} sub={`${stats.unitsSold} unit${stats.unitsSold === 1 ? "" : "s"} sold`} />
            <StatCard label="Cost of goods sold" value={fmt(stats.cogs)} />
            <StatCard label="Gross profit" value={fmt(stats.grossProfit)} accent={stats.grossProfit >= 0 ? C.green : C.rust} sub={`${stats.margin.toFixed(0)}% margin`} />
            <StatCard label="Lost to waste" value={fmt(stats.wasteCost)} accent={stats.wasteCost > 0 ? C.rust : C.green} />
          </div>

          <h3 style={sectionHeading}>Profit trend</h3>
          {trend.length === 0 ? (
            <EmptyNote>
              No sales recorded {period === "all" ? "yet" : `in the last ${period} days`}. Record stock-outs with reason "Sold to customer" to see this fill in.
            </EmptyNote>
          ) : (
            <div style={{ ...cardWrap, marginBottom: 26 }}>
              <TrendChart points={trend} />
            </div>
          )}

          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginTop: trend.length === 0 ? 26 : 0 }}>
            <div style={{ flex: 1, minWidth: isNarrow ? "100%" : 280 }}>
              <h3 style={sectionHeading}>Needs restock</h3>
              {restock.length === 0 ? (
                <EmptyNote positive>Everything is above its reorder level.</EmptyNote>
              ) : (
                <div style={cardWrap}>
                  <HorizontalBars rows={restock.map((r) => ({ ...r, color: C.rust }))} valueLabel={(r) => `${r.qty}/${r.reorderLevel} ${r.unit}`} />
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: isNarrow ? "100%" : 280 }}>
              <h3 style={sectionHeading}>Top sellers</h3>
              {sellers.length === 0 ? (
                <EmptyNote>No sales recorded in this period.</EmptyNote>
              ) : (
                <div style={cardWrap}>
                  <HorizontalBars rows={sellers} valueLabel={(r) => `${fmt(r.value)} · ${r.units} sold`} />
                </div>
              )}
            </div>

            <div style={{ flex: 1, minWidth: isNarrow ? "100%" : 280 }}>
              <h3 style={sectionHeading}>Not selling</h3>
              {idle.length === 0 ? (
                <EmptyNote positive>Everything in stock has sold in this period.</EmptyNote>
              ) : (
                <div style={cardWrap}>
                  <HorizontalBars rows={idle.map((r) => ({ ...r, color: C.goldDeep }))} valueLabel={(r) => `${r.qty} ${r.unit} tied up`} />
                </div>
              )}
            </div>
          </div>

          <div style={{ fontSize: 11.5, color: C.inkSoft, marginTop: 22 }}>
            Covering {rows.length.toLocaleString()} movement{rows.length === 1 ? "" : "s"}
            {rows.length >= MAX_ROWS ? ` (capped at ${MAX_ROWS.toLocaleString()})` : ""}. Only stock-outs recorded with reason "Sold to customer" count toward revenue and profit.
          </div>
        </>
      )}
    </div>
  );
}
