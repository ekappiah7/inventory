import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { C, SERIF, SANS, inputStyle } from "../utils/tokens.js";
import { Field, Button } from "../components/ui.jsx";

export default function AuthScreen() {
  const { signUp, logIn } = useAuth();
  const [mode, setMode] = useState("login"); // "login" | "signup"
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "signup") {
        if (!displayName.trim()) throw new Error("Enter your name.");
        await signUp(email, password, displayName);
      } else {
        await logIn(email, password);
      }
    } catch (err) {
      setError(friendlyAuthError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bgPage, fontFamily: SANS, padding: 16 }}>
      <div style={{ width: 380, maxWidth: "100%", background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 14, padding: 28 }}>
        <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 26, color: C.brownDark, marginBottom: 4 }}>Stockroom</div>
        <div style={{ fontSize: 12.5, color: C.inkSoft, marginBottom: 22 }}>
          {mode === "login" ? "Sign in to your shop's inventory." : "Create an account to set up or join a shop."}
        </div>

        <form onSubmit={submit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {mode === "signup" && (
            <Field label="Your name">
              <input style={inputStyle} value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="e.g. Ama Boateng" />
            </Field>
          )}
          <Field label="Email">
            <input type="email" required style={inputStyle} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </Field>
          <Field label="Password">
            <input type="password" required minLength={6} style={inputStyle} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" />
          </Field>

          {error && (
            <div style={{ background: C.rustSoft, color: C.rust, padding: "8px 12px", borderRadius: 8, fontSize: 12.5 }}>{error}</div>
          )}

          <Button type="submit" variant="solid" disabled={busy} style={{ justifyContent: "center", marginTop: 4 }}>
            {busy ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>
        </form>

        <div style={{ textAlign: "center", marginTop: 16, fontSize: 12.5, color: C.inkSoft }}>
          {mode === "login" ? "New here?" : "Already have an account?"}{" "}
          <button
            onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
            style={{ background: "none", border: "none", color: C.brownMid, fontWeight: 700, cursor: "pointer", fontSize: 12.5 }}
          >
            {mode === "login" ? "Create an account" : "Sign in instead"}
          </button>
        </div>
      </div>
    </div>
  );
}

function friendlyAuthError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "That email already has an account. Try signing in instead.";
  if (code.includes("invalid-credential") || code.includes("wrong-password") || code.includes("user-not-found")) return "Email or password is incorrect.";
  if (code.includes("weak-password")) return "Password should be at least 6 characters.";
  if (code.includes("invalid-email")) return "That doesn't look like a valid email address.";
  return err?.message || "Something went wrong. Try again.";
}
