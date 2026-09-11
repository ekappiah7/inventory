import React, { useState } from "react";
import { Copy, Check } from "lucide-react";
import { C, SERIF } from "../utils/tokens.js";
import { Button } from "./ui.jsx";

export default function TeamTab({ storeId, storeName, members }) {
  const [copied, setCopied] = useState(false);

  async function copyId() {
    try {
      await navigator.clipboard.writeText(storeId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard API unavailable; nothing to fall back to gracefully here
    }
  }

  return (
    <div>
      <div style={{ background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, color: C.brownDark, marginBottom: 6 }}>{storeName}</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 10 }}>
          Share this Store ID with anyone who should have staff access. They create an account, choose "Join with Store ID", and paste it in.
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <code style={{ background: C.panelAlt, padding: "8px 12px", borderRadius: 8, fontSize: 12.5, color: C.ink, flex: 1, wordBreak: "break-all" }}>
            {storeId}
          </code>
          <Button variant="outline" icon={copied ? Check : Copy} onClick={copyId}>{copied ? "Copied" : "Copy"}</Button>
        </div>
      </div>

      <h3 style={{ fontFamily: SERIF, fontSize: 19, color: C.brownDark, marginBottom: 10 }}>Team members</h3>
      <div style={{ background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.panelAlt, textAlign: "left" }}>
              {["Name", "Email", "Role", "Joined"].map((h) => (
                <th key={h} style={{ padding: "10px 14px", color: C.inkSoft, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ borderTop: `1px solid ${C.brownFaint}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: C.ink }}>{m.displayName || "—"}</td>
                <td style={{ padding: "10px 14px", color: C.inkSoft }}>{m.email}</td>
                <td style={{ padding: "10px 14px", color: C.inkSoft, textTransform: "capitalize" }}>{m.role}</td>
                <td style={{ padding: "10px 14px", color: C.inkSoft }}>{m.joinedAt?.toDate ? m.joinedAt.toDate().toLocaleDateString() : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
