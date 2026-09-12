import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AuthScreen from "./pages/AuthScreen.jsx";
import SetupStore from "./pages/SetupStore.jsx";
import StockroomApp from "./StockroomApp.jsx";
import { C, SANS, SERIF } from "./utils/tokens.js";
import { Button } from "./components/ui.jsx";

function Centered({ children }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: C.bgPage, fontFamily: SANS, padding: 16 }}>
      {children}
    </div>
  );
}

function Loading() {
  return <Centered><span style={{ color: C.inkSoft }}>Loading…</span></Centered>;
}

function AccessRemoved() {
  const { logOut, leaveStore } = useAuth();
  return (
    <Centered>
      <div style={{ width: 380, maxWidth: "100%", background: C.panel, border: `1px solid ${C.brownFaint}`, borderRadius: 14, padding: 28 }}>
        <div style={{ fontFamily: SERIF, fontSize: 20, color: C.brownDark, marginBottom: 8 }}>No access to this shop</div>
        <div style={{ fontSize: 13, color: C.inkSoft, lineHeight: 1.5, marginBottom: 20 }}>
          Your access was removed, or the shop no longer exists. If you think this is a mistake, ask the shop owner to send you a
          new invite code.
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <Button variant="solid" onClick={leaveStore}>Join another shop</Button>
          <Button variant="ghost" onClick={logOut}>Sign out</Button>
        </div>
      </div>
    </Centered>
  );
}

function Gate() {
  const { authChecked, user, profileLoaded, needsStoreSetup, store, member, memberLoaded } = useAuth();

  if (!authChecked || (user && !profileLoaded)) return <Loading />;
  if (!user) return <AuthScreen />;
  if (needsStoreSetup) return <SetupStore />;
  if (!memberLoaded) return <Loading />;
  if (!member) return <AccessRemoved />;
  if (!store) return <Loading />;
  return <StockroomApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
