"use client";

// Test-Page zum Verifizieren, dass Sentry funktioniert. Nach Deploy:
// /sentry-example aufrufen, Button klicken → im Sentry-Dashboard sollte
// das Issue innerhalb weniger Sekunden auftauchen. Wenn nichts ankommt:
// Browser-DevTools-Network-Tab nach Requests an /monitoring filtern.

import * as Sentry from "@sentry/nextjs";

export default function SentryExamplePage() {
  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f", minHeight: "100vh", color: "#fff",
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 24, gap: 20,
    }}>
      <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Sentry Test</h1>
      <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.55)", textAlign: "center", maxWidth: 360, lineHeight: 1.5 }}>
        Klick den Button, dann sollte im Sentry-Dashboard ein neues Issue auftauchen.
      </p>
      <button
        onClick={() => {
          throw new Error("Sentry frontend test — " + new Date().toISOString());
        }}
        style={{
          padding: "14px 28px", borderRadius: 14, border: "none",
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
          color: "#fff", fontWeight: 700, fontSize: 15, cursor: "pointer",
          boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
        }}
      >
        Throw frontend error
      </button>
      <button
        onClick={async () => {
          await fetch("/api/sentry-example", { method: "GET" });
        }}
        style={{
          padding: "12px 24px", borderRadius: 14,
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
          color: "#fff", fontWeight: 600, fontSize: 14, cursor: "pointer",
        }}
      >
        Trigger server error
      </button>
      <p style={{ margin: 0, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
        Diese Page nach erfolgreicher Verifikation löschen — sie ist nur ein Smoke-Test.
      </p>
    </div>
  );
  // Sentry.captureMessage is exported for completeness in case someone
  // wants to test message capture from this page without throwing.
  void Sentry;
}
