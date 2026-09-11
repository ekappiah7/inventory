import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { C, SERIF, SANS, inputStyle } from "../utils/tokens.js";
import { Field, Button } from "../components/ui.jsx";

export default function SetupStore() {
  const { user, createStore, joinStore, logOut } = useAuth();
  const [mode, setMode] = useState("create"); // "create" | "join"
  const [storeName, setStoreName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!displayName.trim()) return setError("Enter your name.");
    setBusy(true);
    try {
      if (mode === "create") {
        if (!storeName.trim()) throw new Error("Enter a name for your shop.");
        await createStore(storeName, displayName);
      } else {
        if (!storeId.trim()) throw new Error("Enter the Store ID your shop owner gave you.");
        await joinStore(storeId, displayName);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bgPage, fontFamily: SANS, padding: 16 }}>
      <div style={{ width: 420, maxWidth: "100%", background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 14, padding: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: 21, color: C.brownDark, marginBottom: 4 }}>One more step</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 20 }}>
          Set up a new shop, or join one a colleague already created.
        </div>

        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {[
            { id: "create", label: "Create a shop" },
            { id: "join", label: "Join with Store ID" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => { setMode(t.id); setError(""); }}
              style={{
                flex: 1, fontSize: 12.5, fontWeight: 700, padding: "8px 10px", borderRadius: 8, cursor: "pointer",
                border: `1px solid ${mode === t.id ? C.gold : C.brownFaint}`,
                background: mode === t.id ? C.gold : "transparent",
                color: mode === t.id ? C.brownDark : C.inkSoft,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <Field label="Your name (shown on stock records)">
            <input style={inputStyle} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Ama Boateng" />
          </Field>

          {mode === "create" ? (
            <Field label="Shop name">
              <input style={inputStyle} value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="e.g. Adom Provisions Store" />
            </Field>
          ) : (
            <Field label="Store ID">
              <input style={inputStyle} value={storeId} onChange={(e) => setStoreId(e.target.value)} placeholder="Paste the ID your shop owner shared" />
            </Field>
          )}

          {error && (
            <div style={{ background: C.rustSoft, color: C.rust, padding: "8px 12px", borderRadius: 8, fontSize: 12.5 }}>{error}</div>
          )}

          <Button type="submit" variant="solid" disabled={busy} style={{ justifyContent: "center", marginTop: 4 }}>
            {busy ? "Please wait…" : mode === "create" ? "Create shop" : "Join shop"}
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16 }}>
          <button onClick={logOut} style={{ background: "none", border: "none", color: C.inkSoft, fontSize: 12, cursor: "pointer" }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
