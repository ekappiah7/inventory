import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import AuthScreen from "./pages/AuthScreen.jsx";
import SetupStore from "./pages/SetupStore.jsx";
import StockroomApp from "./StockroomApp.jsx";
import { C, SANS } from "./utils/tokens.js";

function Loading() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh", fontFamily: SANS, color: C.inkSoft, background: C.bgPage }}>
      Loading…
    </div>
  );
}

function Gate() {
  const { authChecked, user, profileLoaded, needsStoreSetup, store, member } = useAuth();

  if (!authChecked || (user && !profileLoaded)) return <Loading />;
  if (!user) return <AuthScreen />;
  if (needsStoreSetup) return <SetupStore />;
  if (!store || !member) return <Loading />;
  return <StockroomApp />;
}

export default function App() {
  return (
    <AuthProvider>
      <Gate />
    </AuthProvider>
  );
}
