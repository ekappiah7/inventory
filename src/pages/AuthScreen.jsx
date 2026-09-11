import React, { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { C, SERIF, SANS, inputStyle } from "../utils/tokens.js";
import { Field, Button } from "../components/ui.jsx";

export default function AuthScreen() {
  const { signUp, logIn, signInWithGoogle } = useAuth();
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

  async function google() {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
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

        <button
          onClick={google}
          disabled={busy}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            fontFamily: SANS, fontSize: 13.5, fontWeight: 600, padding: "9px 14px", borderRadius: 8,
            border: `1px solid ${C.brownFaint}`, background: "#FFFDF8", color: C.ink,
            cursor: busy ? "not-allowed" : "pointer", opacity: busy ? 0.6 : 1,
          }}
        >
          <GoogleIcon /> Continue with Google
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "16px 0", color: C.inkSoft, fontSize: 11.5 }}>
          <div style={{ flex: 1, height: 1, background: C.brownFaint }} />
          or
          <div style={{ flex: 1, height: 1, background: C.brownFaint }} />
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
  if (code.includes("popup-closed-by-user") || code.includes("cancelled-popup-request")) return "";
  if (code.includes("popup-blocked")) return "Your browser blocked the Google sign-in popup. Allow popups for this site and try again.";
  if (code.includes("account-exists-with-different-credential")) return "That email already has a password-based account. Sign in with your password instead.";
  return err?.message || "Something went wrong. Try again.";
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6 29.6 4 24 4c-7.6 0-14.2 4.3-17.7 10.7z" />
      <path fill="#4CAF50" d="M24 44c5.5 0 10.4-1.9 14.3-5.1l-6.6-5.6C29.6 34.9 26.9 36 24 36c-5.3 0-9.7-3.1-11.3-7.9l-6.6 5C9.7 39.6 16.3 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7h0l6.6 5.6C37.4 39.6 44 36 44 24c0-1.2-.1-2.4-.4-3.5z" />
    </svg>
  );
}
