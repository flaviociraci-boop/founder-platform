"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

const CATEGORIES = [
  { id: "ecommerce", label: "E-Commerce", icon: "🛒", color: "#f97316" },
  { id: "apps",      label: "App Dev",    icon: "⚡", color: "#6366f1" },
  { id: "trading",   label: "Trading",    icon: "📈", color: "#10b981" },
  { id: "freelancer",label: "Freelancer", icon: "✦", color: "#f59e0b" },
  { id: "marketing", label: "Marketing",  icon: "◎", color: "#ec4899" },
  { id: "saas",      label: "SaaS",       icon: "☁", color: "#3b82f6" },
  { id: "coaching",  label: "Coaching",   icon: "◉", color: "#8b5cf6" },
];

const SEEKING = [
  { id: "Investoren",    label: "Investoren",    icon: "💰", color: "#f97316" },
  { id: "Mitgründer",   label: "Mitgründer",    icon: "🤝", color: "#6366f1" },
  { id: "Kunden",        label: "Kunden",         icon: "👥", color: "#f59e0b" },
  { id: "Community",     label: "Community",      icon: "🌍", color: "#10b981" },
  { id: "Projektpartner",label: "Projektpartner", icon: "⚡", color: "#ec4899" },
];

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.color])
);

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

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", email: "", password: "", age: "",
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

    const supabase = createClient();

    // 1. Create auth user
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { name: form.name } },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (!data.user) {
      setError("Registrierung fehlgeschlagen. Bitte versuche es erneut.");
      setLoading(false);
      return;
    }

    // 2. Create profile
    const initials = form.name
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const { error: profileError } = await supabase.from("profiles").insert({
      auth_id: data.user.id,
      name: form.name,
      age: parseInt(form.age) || null,
      category: form.category,
      seeking: form.seeking,
      avatar: initials,
      color: CATEGORY_COLORS[form.category] ?? "#6366f1",
      followers: 0,
      following: 0,
      tags: [],
    });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    // 3. Redirect
    if (data.session) {
      router.push("/");
      router.refresh();
    } else {
      // Email confirmation required
      setStep(4);
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
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
    : step === 3 ? "Was suchst du?"
    : "Fast fertig!";

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
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: "0 auto 12px",
            background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 24, boxShadow: "0 8px 32px rgba(99,102,241,0.4)",
          }}>◈</div>
          <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>
            Founder<span style={{ color: "#6366f1" }}>Connect</span>
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

              {[
                { label: "Dein Name",  key: "name"     as const, type: "text",     placeholder: "Max Mustermann" },
                { label: "Email",      key: "email"    as const, type: "email",    placeholder: "deine@email.com" },
                { label: "Passwort",   key: "password" as const, type: "password", placeholder: "••••••••" },
                { label: "Alter",      key: "age"      as const, type: "number",   placeholder: "23" },
              ].map((f) => (
                <div key={f.key} style={{ marginBottom: 14 }}>
                  <label style={label}>{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} style={inputStyle}
                    value={form[f.key]} onChange={setField(f.key)} />
                </div>
              ))}

              {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 12 }}>{error}</p>}

              <button onClick={goToStep2} style={btnPrimary}>Weiter →</button>

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
                    {cat.icon} {cat.label}
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
                    <span style={{ fontSize: 18 }}>{opt.icon}</span>
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
                  {loading ? "Wird erstellt..." : "🚀 Loslegen!"}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP 4: Email confirmation ── */}
          {step === 4 && (
            <div style={{ textAlign: "center", padding: "8px 0" }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
              <p style={{ margin: "0 0 8px", fontWeight: 700, fontSize: 17 }}>Fast fertig!</p>
              <p style={{ margin: "0 0 24px", fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>
                Wir haben dir eine Bestätigungs-Email an <strong style={{ color: "#fff" }}>{form.email}</strong> geschickt.
                Klicke den Link darin um loszulegen.
              </p>
              <a href="/login" style={{
                display: "inline-block", padding: "12px 24px", borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                color: "#fff", fontWeight: 600, fontSize: 14, textDecoration: "none",
              }}>
                Zum Login
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615Z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18Z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332Z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58Z" fill="#EA4335"/>
    </svg>
  );
}
