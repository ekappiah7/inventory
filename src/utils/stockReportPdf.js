// PDF rendering for the stock report. Only ever reached through a dynamic
// import, so jsPDF stays out of the initial bundle.
import { jsPDF } from "jspdf";
import { autoTable } from "jspdf-autotable";
import { summariseStock } from "./stockReport.js";

// jsPDF's built-in fonts can't draw the cedi sign, so the report uses the
// ISO code, which is what a bank or accountant would expect anyway.
const CCY = "GHS";

const BROWN_DARK = [59, 42, 29];
const BROWN_MID = [110, 75, 52];
const GOLD = [200, 153, 46];
const CREAM = [253, 248, 238];
const SAND = [240, 228, 204];
const INK_SOFT = [107, 88, 68];
const RUST = [168, 70, 47];

const MARGIN = 40;

const money = (n, decimals = 2) =>
  `${CCY} ${Number(n || 0).toLocaleString("en-GB", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;

const count = (n) => Number(n || 0).toLocaleString("en-GB");

// Steps the font down until the text fits the space it has been given.
function fitText(doc, text, maxWidth, startSize, minSize = 7) {
  let size = startSize;
  doc.setFontSize(size);
  while (size > minSize && doc.getTextWidth(text) > maxWidth) {
    size -= 0.5;
    doc.setFontSize(size);
  }
  return size;
}

function drawHeader(doc, { storeName, preparedBy, now, pageWidth }) {
  doc.setTextColor(...BROWN_DARK);
  doc.setFont("times", "bold");
  doc.setFontSize(19);
  doc.text(storeName || "Stockroom", MARGIN, 58);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...BROWN_MID);
  doc.text("STOCK REPORT", MARGIN, 74);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...INK_SOFT);
  const stamp = now.toLocaleString("en-GB", {
    day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
  doc.text(stamp, pageWidth - MARGIN, 58, { align: "right" });
  if (preparedBy) {
    doc.text(`Prepared by ${preparedBy}`, pageWidth - MARGIN, 72, { align: "right" });
  }

  doc.setDrawColor(...GOLD);
  doc.setLineWidth(1.5);
  doc.line(MARGIN, 86, pageWidth - MARGIN, 86);
}

function drawSummary(doc, summary, pageWidth) {
  const boxes = [
    { label: "ITEMS TRACKED", value: count(summary.itemCount) },
    { label: "UNITS ON HAND", value: count(summary.totalUnits) },
    { label: "STOCK VALUE (AT COST)", value: money(summary.totalValue) },
    { label: "RETAIL VALUE", value: money(summary.totalRetail) },
  ];

  const gap = 10;
  const contentWidth = pageWidth - MARGIN * 2;
  const boxWidth = (contentWidth - gap * (boxes.length - 1)) / boxes.length;
  const top = 100;
  const height = 54;

  boxes.forEach((box, idx) => {
    const x = MARGIN + idx * (boxWidth + gap);
    doc.setFillColor(...SAND);
    doc.roundedRect(x, top, boxWidth, height, 5, 5, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.8);
    doc.setTextColor(...INK_SOFT);
    doc.text(box.label, x + 10, top + 17);

    doc.setFont("helvetica", "bold");
    doc.setTextColor(...BROWN_DARK);
    const size = fitText(doc, box.value, boxWidth - 20, 13);
    doc.setFontSize(size);
    doc.text(box.value, x + 10, top + 38);
  });

  return top + height;
}

function drawFooters(doc, { storeName, now }) {
  const pages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const stamp = now.toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  for (let page = 1; page <= pages; page++) {
    doc.setPage(page);
    doc.setDrawColor(...SAND);
    doc.setLineWidth(0.7);
    doc.line(MARGIN, pageHeight - 42, pageWidth - MARGIN, pageHeight - 42);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...INK_SOFT);
    doc.text(`${storeName || "Stockroom"} · Generated ${stamp}`, MARGIN, pageHeight - 28);
    doc.text(`Page ${page} of ${pages}`, pageWidth - MARGIN, pageHeight - 28, { align: "right" });
  }
}

export function generateStockReportPdf({ storeName, preparedBy, items, now = new Date() }) {
  const summary = summariseStock(items);
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();

  drawHeader(doc, { storeName, preparedBy, now, pageWidth });
  const afterSummary = drawSummary(doc, summary, pageWidth);

  const showSku = summary.hasSkus;
  const head = [
    [
      "Item",
      ...(showSku ? ["SKU"] : []),
      "Category",
      "On hand",
      "Cost each",
      "Sells for",
      "Stock value",
    ],
  ];

  const body = summary.rows.map((r) => [
    r.name,
    ...(showSku ? [r.sku || "—"] : []),
    r.category,
    `${count(r.qty)}${r.unit ? ` ${r.unit}` : ""}${r.low ? "  LOW" : ""}`,
    r.cost > 0 ? money(r.cost) : "Not set",
    r.sellPrice > 0 ? money(r.sellPrice) : "Not set",
    money(r.value),
  ]);

  const foot = [
    [
      { content: "Total", colSpan: showSku ? 3 : 2 },
      `${count(summary.totalUnits)} units`,
      "",
      "",
      money(summary.totalValue),
    ],
  ];

  autoTable(doc, {
    head,
    body,
    foot,
    startY: afterSummary + 22,
    margin: { left: MARGIN, right: MARGIN, top: 60, bottom: 56 },
    // The grand total belongs at the end, not restated on every page, and a
    // single item should never be torn across a page break.
    showFoot: "lastPage",
    rowPageBreak: "avoid",
    styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: [42, 28, 18], lineColor: SAND, lineWidth: 0.5 },
    headStyles: { fillColor: BROWN_DARK, textColor: CREAM, fontStyle: "bold", fontSize: 8 },
    footStyles: { fillColor: SAND, textColor: BROWN_DARK, fontStyle: "bold", fontSize: 8.5 },
    alternateRowStyles: { fillColor: [252, 249, 242] },
    // Widths are pinned so long category names wrap inside their column
    // instead of running into the numbers beside them.
    columnStyles: showSku
      ? {
          0: { cellWidth: 110, fontStyle: "bold" },
          1: { cellWidth: 52 },
          2: { cellWidth: 70 },
          3: { cellWidth: 58, halign: "right" },
          4: { cellWidth: 68, halign: "right" },
          5: { cellWidth: 68, halign: "right" },
          6: { cellWidth: 88, halign: "right" },
        }
      : {
          0: { cellWidth: 130, fontStyle: "bold" },
          1: { cellWidth: 78 },
          2: { cellWidth: 62, halign: "right" },
          3: { cellWidth: 74, halign: "right" },
          4: { cellWidth: 74, halign: "right" },
          5: { cellWidth: 94, halign: "right" },
        },
    didParseCell: (data) => {
      if (data.section !== "body") return;
      const row = summary.rows[data.row.index];
      if (!row) return;
      const qtyCol = showSku ? 3 : 2;
      const costCol = showSku ? 4 : 3;
      const sellCol = showSku ? 5 : 4;
      if (data.column.index === qtyCol && row.low) {
        data.cell.styles.textColor = RUST;
        data.cell.styles.fontStyle = "bold";
      }
      if (data.column.index === costCol && row.cost <= 0) data.cell.styles.textColor = RUST;
      if (data.column.index === sellCol && row.sellPrice <= 0) data.cell.styles.textColor = RUST;
    },
  });

  let cursorY = doc.lastAutoTable.finalY + 16;

  if (summary.totalValue > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...INK_SOFT);
    doc.text(
      `Sold in full at current prices, this stock would return ${money(summary.totalRetail)}, a gross profit of ${money(summary.potentialProfit)}.`,
      MARGIN,
      cursorY
    );
    cursorY += 16;
  }

  if (summary.missingCostCount > 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...RUST);
    doc.text(
      `${summary.missingCostCount} item(s) have no cost price recorded, so they add nothing to the stock value above.`,
      MARGIN,
      cursorY
    );
    cursorY += 20;
  }

  if (summary.lowRows.length > 0) {
    doc.setFont("times", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BROWN_DARK);
    doc.text(`Needs restock (${summary.lowRows.length})`, MARGIN, cursorY + 6);

    autoTable(doc, {
      head: [["Item", "On hand", "Reorder at", "Short by", "Supplier"]],
      body: summary.lowRows.map((r) => [
        r.name,
        `${count(r.qty)}${r.unit ? ` ${r.unit}` : ""}`,
        `${count(r.reorderLevel)}${r.unit ? ` ${r.unit}` : ""}`,
        `${count(r.shortfall)}${r.unit ? ` ${r.unit}` : ""}`,
        r.supplierName || "—",
      ]),
      startY: cursorY + 16,
      margin: { left: MARGIN, right: MARGIN, top: 60, bottom: 56 },
      rowPageBreak: "avoid",
      styles: { font: "helvetica", fontSize: 8.5, cellPadding: 5, textColor: [42, 28, 18], lineColor: SAND, lineWidth: 0.5 },
      headStyles: { fillColor: BROWN_MID, textColor: CREAM, fontStyle: "bold", fontSize: 8 },
      columnStyles: { 0: { fontStyle: "bold" }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right" } },
    });
  }

  drawFooters(doc, { storeName, now });
  return doc;
}

export function downloadStockReportPdf({ storeName, preparedBy, items, now = new Date() }) {
  const doc = generateStockReportPdf({ storeName, preparedBy, items, now });
  const slug = (storeName || "stockroom").replace(/\s+/g, "-").toLowerCase();
  doc.save(`${slug}-stock-report-${now.toISOString().slice(0, 10)}.pdf`);
}
