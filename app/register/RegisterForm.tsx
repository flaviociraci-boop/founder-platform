"use client";

import { useState } from "react";
import Image from "next/image";
import { categories } from "@/app/lib/data";
import { registerUser } from "./actions";

const CATEGORIES = categories.filter((c) => c.id !== "all");

const SEEKING = [
  { id: "Investoren",    label: "Investoren",    color: "#f97316" },
  { id: "Mitgründer",   label: "Mitgründer",    color: "#6366f1" },
  { id: "Kunden",        label: "Kunden",         color: "#f59e0b" },
  { id: "Community",     label: "Community",      color: "#10b981" },
  { id: "Projektpartner",label: "Projektpartner", color: "#ec4899" },
];

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 14,
  padding: "14px 16px",
  color: "#fff",
  fontSize: 15,
  outline: "none",
  boxSizing: "border-box",
  fontFamily: "'DM Sans', sans-serif",
};

const btnPrimary: React.CSSProperties = {
  width: "100%",
  padding: "15px 0",
  borderRadius: 14,
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  border: "none",
  color: "#fff",
  fontWeight: 700,
  fontSize: 16,
  cursor: "pointer",
  marginTop: 8,
};

const btnSecondary: React.CSSProperties = {
  ...btnPrimary,
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
};

const label: React.CSSProperties = {
  fontSize: 12,
  color: "rgba(255,255,255,0.4)",
  textTransform: "uppercase",
  letterSpacing: 1,
  display: "block",
  marginBottom: 6,
};

type Props = { prefilledEmail?: string };

export default function RegisterForm({ prefilledEmail = "" }: Props) {
  const emailLocked = !!prefilledEmail;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: prefilledEmail, password: "", age: "",
    category: "", seeking: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const setField = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const validateStep1 = () => {
    if (!form.name.trim()) return "Bitte Namen eingeben.";
    if (!form.email.trim()) return "Bitte Email eingeben.";
    if (form.password.length < 6) return "Passwort muss mindestens 6 Zeichen lang sein.";
    if (!form.age) return "Bitte Alter eingeben.";
    return "";
  };

  const goToStep2 = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const goToStep3 = () => {
    if (!form.category) { setError("Bitte eine Kategorie wählen."); return; }
    setError("");
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!form.seeking) { setError("Bitte auswählen was du suchst."); return; }
    setLoading(true);
    setError("");

    // Server-Action validiert Subscription, legt User via Admin-API an,
    // verknüpft Sub + Profile, setzt Session, redirected auf "/".
    // Bei Erfolg kommt der Code hierhin nicht zurück.
    const result = await registerUser({
      email: form.email,
      password: form.password,
      name: form.name,
      age: form.age,
      category: form.category,
      seeking: form.seeking,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  };

  const Progress = () => (
    <div style={{ display: "flex", gap: 6, marginBottom: 24 }}>
      {[1, 2, 3].map((s) => (
        <div key={s} style={{
          flex: 1, height: 3, borderRadius: 10,
          background: s <= step ? "#6366f1" : "rgba(255,255,255,0.1)",
          transition: "background 0.2s",
        }} />
      ))}
    </div>
  );

  const stepLabel =
    step === 1 ? "Erstelle dein Profil"
    : step === 2 ? "Wähle deine Kategorie"
    : "Was suchst du?";

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ position: "fixed", top: -150, left: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)", pointerEvents: "none" }} />
      <div style={{ position: "fixed", bottom: -150, right: -150, width: 500, height: 500, background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ width: "100%", maxWidth: 400, position: "relative", zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <Image
            src="/logo-icon.png"
            alt="Connectyfind"
            width={40}
            height={40}
            style={{ borderRadius: 12, margin: "0 auto 12px", display: "block" }}
            quality={100}
          />
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5, color: "#fff" }}>
            Connectyfind
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{stepLabel}</p>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 24,
          padding: 28,
        }}>
          {/* ── STEP 1: Basics ── */}
          {step === 1 && (
            <div>
              <Progress />

              {([
                { label: "Dein Name",  key: "name"     as const, type: "text",     placeholder: "Max Mustermann" },
                { label: "Email",      key: "email"    as const, type: "email",    placeholder: "deine@email.com", helper: "Verwende die gleiche Email, mit der du bei Whop bezahlt hast" },
                { label: "Passwort",   key: "password" as const, type: "password", placeholder: "••••••••" },
                { label: "Alter",      key: "age"      as const, type: "number",   placeholder: "23" },
              ] as Array<{ label: string; key: "name" | "email" | "password" | "age"; type: string; placeholder: string; helper?: string }>).map((f) => {
                const isLockedEmail = f.key === "email" && emailLocked;
                return (
                  <div key={f.key} style={{ marginBottom: 14 }}>
                    <label style={label}>{f.label}</label>
                    <input
                      type={f.type}
                      placeholder={f.placeholder}
                      style={{
                        ...inputStyle,
                        ...(isLockedEmail
                          ? { opacity: 0.75, cursor: "not-allowed", color: "rgba(255,255,255,0.75)" }
                          : {}),
                      }}
                      value={form[f.key]}
                      onChange={setField(f.key)}
                      disabled={isLockedEmail}
                    />
                    {isLockedEmail ? (
                      <p style={{ margin: "6px 2px 0", fontSize: 12, color: "#10b981", lineHeight: 1.4, display: "flex", alignItems: "center", gap: 4 }}>
                        <span aria-hidden>✓</span> Verifiziert über Whop
                      </p>
                    ) : f.helper ? (
                      <p style={{ margin: "6px 2px 0", fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.4 }}>
                        {f.helper}
                      </p>
                    ) : null}
                  </div>
                );
              })}

              {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

              <button onClick={goToStep2} style={btnPrimary}>Weiter →</button>

              {/* PHASE 2 LOCKDOWN: Google Register deaktiviert
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>oder</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>

              <button onClick={handleGoogle} style={{
                ...btnSecondary, marginTop: 0,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
              }}>
                <GoogleIcon /> Mit Google registrieren
              </button>
              */}

              <p style={{ textAlign: "center", marginTop: 20, fontSize: 14, color: "rgba(255,255,255,0.4)" }}>
                Schon registriert?{" "}
                <a href="/login" style={{ color: "#6366f1", fontWeight: 600, textDecoration: "none" }}>Einloggen</a>
              </p>
            </div>
          )}

          {/* ── STEP 2: Category ── */}
          {step === 2 && (
            <div>
              <Progress />
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Was machst du?</h3>

              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
                {CATEGORIES.map((cat) => (
                  <button key={cat.id}
                    onClick={() => setForm((p) => ({ ...p, category: cat.id }))}
                    style={{
                      padding: "10px 16px", borderRadius: 20, cursor: "pointer",
                      border: form.category === cat.id ? `1px solid ${cat.color}` : "1px solid rgba(255,255,255,0.1)",
                      background: form.category === cat.id ? `${cat.color}22` : "rgba(255,255,255,0.04)",
                      color: form.category === cat.id ? cat.color : "rgba(255,255,255,0.6)",
                      fontSize: 13, fontWeight: 600, transition: "all 0.15s",
                    }}>
                    {cat.label}
                  </button>
                ))}
              </div>

              {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(1); setError(""); }} style={{ ...btnSecondary, flex: 1, marginTop: 0 }}>← Zurück</button>
                <button onClick={goToStep3} style={{ ...btnPrimary, flex: 2, marginTop: 0 }}>Weiter →</button>
              </div>
            </div>
          )}

          {/* ── STEP 3: Seeking ── */}
          {step === 3 && (
            <div>
              <Progress />
              <h3 style={{ margin: "0 0 16px", fontSize: 16, fontWeight: 700 }}>Was suchst du?</h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {SEEKING.map((opt) => (
                  <button key={opt.id}
                    onClick={() => setForm((p) => ({ ...p, seeking: opt.id }))}
                    style={{
                      padding: "14px 16px", borderRadius: 14, cursor: "pointer", textAlign: "left",
                      border: form.seeking === opt.id ? `1px solid ${opt.color}55` : "1px solid rgba(255,255,255,0.08)",
                      background: form.seeking === opt.id ? `${opt.color}15` : "rgba(255,255,255,0.04)",
                      color: form.seeking === opt.id ? opt.color : "rgba(255,255,255,0.6)",
                      fontSize: 14, fontWeight: 600, transition: "all 0.15s",
                      display: "flex", alignItems: "center", gap: 10,
                    }}>
                    {opt.label}
                    {form.seeking === opt.id && <span style={{ marginLeft: "auto" }}>✓</span>}
                  </button>
                ))}
              </div>

              {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => { setStep(2); setError(""); }} style={{ ...btnSecondary, flex: 1, marginTop: 0 }}>← Zurück</button>
                <button onClick={handleSubmit} disabled={loading}
                  style={{
                    ...btnPrimary, flex: 2, marginTop: 0,
                    background: "linear-gradient(135deg, #10b981, #059669)",
                    opacity: loading ? 0.7 : 1,
                  }}>
                  {loading ? "Wird erstellt..." : "Loslegen!"}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

