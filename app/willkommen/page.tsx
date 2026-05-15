"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";

export default function WillkommenPage() {
  const router = useRouter();

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Background glows */}
      <div style={{
        position: "fixed", top: -150, left: -150, width: 500, height: 500,
        background: "radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: -150, right: -150, width: 500, height: 500,
        background: "radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{
        maxWidth: 420, width: "100%", textAlign: "center",
        position: "relative", zIndex: 1,
      }}>
        {/* Icon */}
        <Image src="/icon-192.png" alt="Connectyfind Logo" width={192} height={192} className="w-24 h-24 rounded-xl" priority quality={100} style={{ margin: "0 auto 28px", display: "block", boxShadow: "0 12px 40px rgba(99,102,241,0.4)" }} />

        {/* Badge */}
        <div style={{
          display: "inline-block", padding: "5px 14px", marginBottom: 20,
          background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 20, fontSize: 11, fontWeight: 700, color: "#6366f1",
          letterSpacing: 1,
        }}>EARLY ACCESS BESTÄTIGT</div>

        <h1 style={{
          fontSize: 30, fontWeight: 800, margin: "0 0 16px", lineHeight: 1.25,
        }}>
          Willkommen bei<br />
          <span style={{
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
          }}>Connectyfind!</span>
        </h1>

        <p style={{
          fontSize: 15, color: "rgba(255,255,255,0.7)", lineHeight: 1.65,
          margin: "0 0 32px",
        }}>
          Du stehst jetzt auf der Waitlist. Wir benachrichtigen dich als Erste sobald die Plattform live geht — versprochen.
        </p>

        {/* Info box */}
        <div style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
          border: "1px solid rgba(99,102,241,0.2)",
          borderRadius: 16, padding: "18px 20px",
          fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6,
          marginBottom: 32, textAlign: "left",
        }}>
          <div style={{ fontWeight: 700, color: "#fff", marginBottom: 6 }}>Was passiert als nächstes?</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#6366f1", flexShrink: 0 }}>01</span>
              <span>Wir bauen die Plattform fertig — mit echten Foundern im Kopf.</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#6366f1", flexShrink: 0 }}>02</span>
              <span>Du bekommst eine E-Mail sobald wir live gehen.</span>
            </div>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              <span style={{ color: "#6366f1", flexShrink: 0 }}>03</span>
              <span>Early-Access-Mitglieder erhalten bevorzugten Zugang.</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => router.push("/")}
          style={{
            width: "100%", padding: "15px 0",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            border: "none", color: "#fff", borderRadius: 14,
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            boxShadow: "0 8px 24px rgba(99,102,241,0.4)",
          }}
        >
          Zur Startseite
        </button>
      </div>
    </div>
  );
}
