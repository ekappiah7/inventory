import React from "react";
import { X, AlertTriangle } from "lucide-react";
import { C, SERIF, SANS } from "../utils/tokens.js";

export function Button({ children, onClick, variant = "solid", icon: Icon, style, type = "button", disabled }) {
  const base = {
    display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS,
    fontSize: 13.5, fontWeight: 600, padding: "8px 14px", borderRadius: 8,
    cursor: disabled ? "not-allowed" : "pointer", border: "1px solid transparent",
    transition: "background-color .15s, border-color .15s", opacity: disabled ? 0.5 : 1,
    whiteSpace: "nowrap",
  };
  const variants = {
    solid: { background: C.gold, color: C.brownDark, borderColor: C.gold },
    dark: { background: C.brownDark, color: C.panel, borderColor: C.brownDark },
    outline: { background: "transparent", color: C.brownDark, borderColor: C.brownFaint },
    ghost: { background: "transparent", color: C.inkSoft, borderColor: "transparent" },
    danger: { background: C.rust, color: C.panel, borderColor: C.rust },
  };
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={(e) => { if (!disabled && variant === "solid") e.currentTarget.style.background = C.goldDeep; }}
      onMouseLeave={(e) => { if (!disabled && variant === "solid") e.currentTarget.style.background = C.gold; }}
    >
      {Icon && <Icon size={15} strokeWidth={2.2} />}
      {children}
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4, fontFamily: SANS }}>
      <span style={{ fontSize: 12, color: C.inkSoft, fontWeight: 600 }}>{label}</span>
      {children}
    </label>
  );
}

export function Modal({ title, onClose, children, width = 460 }) {
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(42,28,18,0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, padding: 16 }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: C.panel, borderRadius: 14, width, maxWidth: "100%", maxHeight: "88vh", overflowY: "auto", boxShadow: "0 20px 60px rgba(0,0,0,.25)", border: `1px solid ${C.brownFaint}` }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: `1px solid ${C.brownFaint}` }}>
          <h3 style={{ fontFamily: SERIF, fontSize: 19, color: C.brownDark, margin: 0 }}>{title}</h3>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

export function ConfirmDialog({ title, message, confirmLabel = "Confirm", danger = true, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} width={380}>
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
        <AlertTriangle size={20} color={danger ? C.rust : C.gold} style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 13.5, color: C.ink, lineHeight: 1.5 }}>{message}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20 }}>
        <Button variant="ghost" onClick={onCancel}>Cancel</Button>
        <Button variant={danger ? "danger" : "solid"} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Modal>
  );
}
