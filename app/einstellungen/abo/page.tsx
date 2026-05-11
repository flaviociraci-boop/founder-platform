"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Subscription = {
  status: string;
  plan_type: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
};

function formatDate(iso: string | null): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-CH", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    active:   { label: "Aktiv",     bg: "rgba(16,185,129,0.12)",  color: "#10b981" },
    trialing: { label: "Trial",     bg: "rgba(99,102,241,0.12)",  color: "#6366f1" },
    inactive: { label: "Inaktiv",   bg: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)" },
    canceled: { label: "Gekündigt", bg: "rgba(239,68,68,0.1)",    color: "#f87171" },
  };
  const style = map[status] ?? map.inactive;
  return (
    <span style={{
      display: "inline-block", padding: "3px 10px", borderRadius: 20,
      background: style.bg, color: style.color,
      fontSize: 12, fontWeight: 700,
    }}>
      {style.label}
    </span>
  );
}

export default function AboPage() {
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data } = await supabase
        .from("subscriptions")
        .select("status, plan_type, trial_ends_at, current_period_end, canceled_at")
        .eq("user_id", user.id)
        .maybeSingle();

      setSub(data ?? null);
      setLoading(false);
    })();
  }, [router]);

  const planLabel = sub?.plan_type === "monthly"
    ? "Pro Monatlich — $29/Monat"
    : sub?.plan_type === "yearly"
    ? "Pro Jährlich — $249/Jahr"
    : "–";

  const nextDateLabel = () => {
    if (!sub) return null;
    if (sub.status === "trialing" && sub.trial_ends_at)
      return { label: "Trial endet am", value: formatDate(sub.trial_ends_at) };
    if (sub.status === "canceled" && sub.canceled_at)
      return { label: "Gekündigt am", value: formatDate(sub.canceled_at) };
    if (sub.current_period_end)
      return { label: "Nächste Abrechnung", value: formatDate(sub.current_period_end) };
    return null;
  };

  const dateInfo = nextDateLabel();

  return (
    <div style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", background: "#0a0a0f", minHeight: "100vh", color: "#fff" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
        background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 10, width: 36, height: 36, color: "#fff", cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >←</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Mein Abo</span>
      </div>

      <div style={{ padding: "24px 20px" }}>
        {loading ? (
          <div style={{ textAlign: "center", paddingTop: 60, color: "rgba(255,255,255,0.3)", fontSize: 14 }}>
            Laden…
          </div>
        ) : sub ? (
          <>
            {/* Subscription card */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: 20,
              marginBottom: 16,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                <div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>
                    Plan
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{planLabel}</div>
                </div>
                <StatusBadge status={sub.status} />
              </div>

              {dateInfo && (
                <div style={{
                  borderTop: "1px solid rgba(255,255,255,0.07)",
                  paddingTop: 14,
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                }}>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{dateInfo.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{dateInfo.value}</span>
                </div>
              )}
            </div>

            {/* Manage at Whop */}
            <a
              href="https://whop.com/orders/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block", padding: "15px 0", borderRadius: 14,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center",
                textDecoration: "none", marginBottom: 12,
              }}
            >
              Abo verwalten bei Whop ↗
            </a>
          </>
        ) : (
          <>
            {/* No subscription */}
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: 28,
              textAlign: "center",
              marginBottom: 16,
            }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⚡</div>
              <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 16 }}>Kein aktives Abo</p>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.4)", lineHeight: 1.6 }}>
                Werde Pro und bekomme unbegrenzten Zugang zu allen Features.
              </p>
            </div>

            <a
              href="/pricing"
              style={{
                display: "block", padding: "15px 0", borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontWeight: 700, fontSize: 15, textAlign: "center",
                textDecoration: "none",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              Pro werden →
            </a>
          </>
        )}
      </div>
    </div>
  );
}
