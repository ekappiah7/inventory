import React, { useState } from "react";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import { FileUp, Download, ChevronRight } from "lucide-react";
import { C } from "../utils/tokens.js";
import { Modal, Button } from "./ui.jsx";
import { parseFreeformLine, normalizeRow, downloadCsv } from "../utils/parse.js";

const TEMPLATE_CSV = "Name,SKU,Category,Qty,Reorder Level,Unit,Cost Price,Sell Price,Supplier\nBasmati Rice 5kg,GR-1001,Grains,40,15,bag,38,48,Kumasi Wholesale\n";

export default function ImportModal({ onClose, onCommit }) {
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");

  async function handleFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    setError("");
    const ext = file.name.split(".").pop().toLowerCase();
    try {
      if (ext === "csv") {
        const text = await file.text();
        const parsed = Papa.parse(text, { header: true, skipEmptyLines: true });
        const rows = parsed.data.map(normalizeRow).filter(Boolean);
        if (!rows.length) throw new Error("No recognizable rows found in that CSV.");
        setPreview(rows);
      } else if (ext === "xlsx" || ext === "xls") {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        const rows = json.map(normalizeRow).filter(Boolean);
        if (!rows.length) throw new Error("No recognizable rows found in that spreadsheet.");
        setPreview(rows);
      } else if (ext === "docx") {
        const buf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer: buf });
        const lines = result.value.split("\n").map(parseFreeformLine).filter(Boolean);
        if (!lines.length) throw new Error("Couldn't find item lines in that document.");
        const rows = lines.map((l) => ({
          name: l.name, sku: "", category: "General", qty: l.qty || 0,
          reorderLevel: 5, unit: "pcs", costPrice: 0, sellPrice: 0, supplierName: "",
        }));
        setPreview(rows);
      } else {
        throw new Error("Use a .csv, .xlsx, .xls, or .docx file.");
      }
    } catch (err) {
      setError(err.message || "Couldn't read that file.");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <Modal title="Import inventory" onClose={onClose} width={560}>
      {!preview ? (
        <div>
          <p style={{ fontSize: 13.5, color: C.inkSoft, lineHeight: 1.5, marginTop: 0 }}>
            Upload a CSV, Excel, or Word file listing your items. Columns like <em>name</em>, <em>qty</em>,{" "}
            <em>reorder level</em>, <em>category</em>, and <em>price</em> are picked up automatically. A Word file can just be one item per line.
          </p>
          <div style={{ border: `1.5px dashed ${C.brownSoft}`, borderRadius: 12, padding: "28px 20px", textAlign: "center", background: C.panelAlt }}>
            <FileUp size={26} color={C.brownMid} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13.5, marginBottom: 12 }}>Drop a file here, or</div>
            <input type="file" accept=".csv,.xlsx,.xls,.docx" onChange={handleFile} style={{ display: "none" }} id="import-file" />
            <Button variant="dark" onClick={() => document.getElementById("import-file").click()}>Choose file</Button>
          </div>
          {error && (
            <div style={{ background: C.rustSoft, color: C.rust, padding: "8px 12px", borderRadius: 8, fontSize: 12.5, marginTop: 12 }}>
              {error}
            </div>
          )}
          <button
            onClick={() => downloadCsv("stockroom-import-template.csv", TEMPLATE_CSV)}
            style={{ marginTop: 14, background: "none", border: "none", color: C.brownMid, fontSize: 12.5, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 5 }}
          >
            <Download size={13} /> Download a CSV template
          </button>
        </div>
      ) : (
        <div>
          <div style={{ fontSize: 13.5, color: C.inkSoft, marginBottom: 10 }}>
            Found {preview.length} item{preview.length > 1 ? "s" : ""}. Review, then add them to your inventory.
          </div>
          <div style={{ maxHeight: 260, overflowY: "auto", border: `1px solid ${C.brownFaint}`, borderRadius: 10 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12.5 }}>
              <thead>
                <tr style={{ background: C.panelAlt }}>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Name</th>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Category</th>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Qty</th>
                  <th style={{ padding: "8px 10px", textAlign: "left" }}>Reorder</th>
                </tr>
              </thead>
              <tbody>
                {preview.map((r, idx) => (
                  <tr key={idx} style={{ borderTop: `1px solid ${C.brownFaint}` }}>
                    <td style={{ padding: "7px 10px" }}>{r.name}</td>
                    <td style={{ padding: "7px 10px", color: C.inkSoft }}>{r.category}</td>
                    <td style={{ padding: "7px 10px" }}>{r.qty}</td>
                    <td style={{ padding: "7px 10px", color: C.inkSoft }}>{r.reorderLevel}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 18 }}>
            <Button variant="ghost" onClick={() => setPreview(null)}>Back</Button>
            <Button variant="solid" icon={ChevronRight} onClick={() => onCommit(preview)}>Add {preview.length} items</Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
