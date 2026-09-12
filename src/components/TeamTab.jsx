import React, { useState } from "react";
import { Copy, Check, RefreshCw, UserMinus, Download } from "lucide-react";
import { C, SERIF } from "../utils/tokens.js";
import { Button } from "./ui.jsx";

export default function TeamTab({
  store,
  members,
  currentUid,
  isOwner,
  itemCount,
  onRegenerateInvite,
  onRemoveMember,
  onBackup,
  onClearRequest,
}) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [backingUp, setBackingUp] = useState(false);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(store.inviteCode || "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; the code is on screen to type manually
    }
  }

  async function regenerate() {
    setRegenerating(true);
    await onRegenerateInvite();
    setRegenerating(false);
  }

  async function backup() {
    setBackingUp(true);
    await onBackup();
    setBackingUp(false);
  }

  return (
    <div>
      <div style={{ background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, padding: "16px 18px", marginBottom: 22 }}>
        <div style={{ fontFamily: SERIF, fontSize: 17, color: C.brownDark, marginBottom: 6 }}>{store.name}</div>
        {isOwner ? (
          <>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 10, lineHeight: 1.5 }}>
              Share this invite code with anyone who should have staff access. They create an account, choose "Join with a code",
              and type it in. If it ever gets into the wrong hands, generate a new one: the old code stops working immediately.
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <code style={{ background: C.panelAlt, padding: "10px 14px", borderRadius: 8, fontSize: 16, letterSpacing: 2, fontWeight: 700, color: C.ink }}>
                {store.inviteCode || "—"}
              </code>
              <Button variant="outline" icon={copied ? Check : Copy} onClick={copyCode}>{copied ? "Copied" : "Copy"}</Button>
              <Button variant="ghost" icon={RefreshCw} onClick={regenerate} disabled={regenerating}>
                {regenerating ? "Generating…" : "New code"}
              </Button>
            </div>
          </>
        ) : (
          <div style={{ fontSize: 12.5, color: C.inkSoft }}>
            You're a staff member of this shop. Only the owner can invite or remove people.
          </div>
        )}
      </div>

      <h3 style={{ fontFamily: SERIF, fontSize: 19, color: C.brownDark, marginBottom: 10 }}>Team members</h3>
      <div style={{ background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", minWidth: 520, borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ background: C.panelAlt, textAlign: "left" }}>
              {["Name", "Email", "Role", "Joined", ""].map((h) => (
                <th key={h} style={{ padding: "10px 14px", color: C.inkSoft, fontWeight: 600, fontSize: 12 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id} style={{ borderTop: `1px solid ${C.brownFaint}` }}>
                <td style={{ padding: "10px 14px", fontWeight: 700, color: C.ink }}>
                  {m.displayName || "—"}{m.id === currentUid ? " (you)" : ""}
                </td>
                <td style={{ padding: "10px 14px", color: C.inkSoft }}>{m.email}</td>
                <td style={{ padding: "10px 14px", color: C.inkSoft, textTransform: "capitalize" }}>{m.role}</td>
                <td style={{ padding: "10px 14px", color: C.inkSoft }}>{m.joinedAt?.toDate ? m.joinedAt.toDate().toLocaleDateString() : "—"}</td>
                <td style={{ padding: "10px 14px" }}>
                  {isOwner && m.role !== "owner" && (
                    <button
                      title="Remove from shop"
                      onClick={() => onRemoveMember(m)}
                      style={{ display: "flex", alignItems: "center", gap: 5, background: "none", border: "none", cursor: "pointer", color: C.rust, fontSize: 12, fontWeight: 600, padding: 4 }}
                    >
                      <UserMinus size={14} /> Remove
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {isOwner && (
        <>
          <div style={{ marginTop: 28, background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontFamily: SERIF, fontSize: 17, color: C.brownDark, marginBottom: 6 }}>Backup</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 12, lineHeight: 1.5 }}>
              Downloads everything in this shop (items, suppliers, and the full movement history) as a single JSON file. Nothing is
              backed up automatically, so take one of these periodically and keep it somewhere safe.
            </div>
            <Button variant="outline" icon={Download} onClick={backup} disabled={backingUp}>
              {backingUp ? "Preparing…" : "Download backup"}
            </Button>
          </div>

          <div style={{ marginTop: 20, background: C.panel, border: `1px solid ${C.rustSoft}`, borderRadius: 12, padding: "16px 18px" }}>
            <div style={{ fontFamily: SERIF, fontSize: 17, color: C.rust, marginBottom: 6 }}>Start from a clean sheet</div>
            <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 12, lineHeight: 1.5 }}>
              Deletes all {itemCount} item{itemCount === 1 ? "" : "s"}, every supplier, and the whole activity history for this shop.
              Your account and your team stay exactly as they are. There's no undo, so take a backup first.
            </div>
            <Button variant="danger" onClick={onClearRequest}>Clear all shop data</Button>
          </div>
        </>
      )}
    </div>
  );
}
