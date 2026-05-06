"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Company = {
  id: number;
  name: string;
  role: string;
  type: string;
  year: string;
  active: boolean;
};

type FormState = Omit<Company, "id">;

const EMPTY: FormState = { name: "", role: "", type: "", year: "", active: true };

const inp: React.CSSProperties = {
  width: "100%", boxSizing: "border-box",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, padding: "12px 14px",
  color: "#fff", fontSize: 15, outline: "none",
  fontFamily: "'DM Sans', sans-serif",
};

const lbl: React.CSSProperties = {
  fontSize: 12, color: "rgba(255,255,255,0.38)",
  textTransform: "uppercase", letterSpacing: 1,
  display: "block", marginBottom: 6, fontWeight: 600,
};

export default function FirmenPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);

  const [profileId, setProfileId] = useState<number | null>(null);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      // Prefer the pid URL param (passed by ProfileDashboard) — avoids auth_id mismatch
      const pidParam = searchParams.get("pid");
      let resolvedProfileId: number | null = pidParam ? Number(pidParam) : null;

      if (!resolvedProfileId) {
        // Fallback: look up via auth_id
        const { data: profile } = await supabase
          .from("profiles").select("id").eq("auth_id", user.id).maybeSingle();
        resolvedProfileId = profile?.id ?? null;
      }

      if (!resolvedProfileId) {
        setLoadError("Profil konnte nicht gefunden werden. Bitte gehe zurück und versuche es erneut.");
        setLoading(false);
        return;
      }

      setProfileId(resolvedProfileId);
      const { data, error: fetchErr } = await supabase
        .from("companies").select("*").eq("profile_id", resolvedProfileId).order("created_at");

      if (fetchErr) {
        setLoadError(`Firmen konnten nicht geladen werden: ${fetchErr.message}`);
      } else {
        setCompanies((data ?? []).map((c) => ({
          id: c.id, name: c.name, role: c.role ?? "",
          type: c.type ?? "", year: c.year ?? "", active: c.active ?? true,
        })));
      }
      setLoading(false);
    };
    load();
  }, [supabase, router, searchParams]);

  const startEdit = (company: Company) => {
    setEditingId(company.id);
    setForm({ name: company.name, role: company.role, type: company.type, year: company.year, active: company.active });
    setError("");
  };

  const startNew = () => {
    setEditingId("new");
    setForm(EMPTY);
    setError("");
  };

  const cancel = () => { setEditingId(null); setError(""); };

  const save = async () => {
    if (!form.name.trim()) { setError("Name ist erforderlich."); return; }
    if (!profileId) return;
    setSaving(true);
    setError("");

    if (editingId === "new") {
      const { data, error: err } = await supabase
        .from("companies")
        .insert({ profile_id: profileId, ...form, name: form.name.trim() })
        .select().single();
      if (err) { setError(err.message); setSaving(false); return; }
      setCompanies((p) => [...p, { id: data.id, ...form, name: form.name.trim() }]);
    } else {
      const { error: err } = await supabase
        .from("companies").update({ ...form, name: form.name.trim() }).eq("id", editingId);
      if (err) { setError(err.message); setSaving(false); return; }
      setCompanies((p) => p.map((c) => c.id === editingId ? { ...c, ...form, name: form.name.trim() } : c));
    }

    setSaving(false);
    setEditingId(null);
  };

  const remove = async (id: number) => {
    const { error: err } = await supabase.from("companies").delete().eq("id", id);
    if (!err) setCompanies((p) => p.filter((c) => c.id !== id));
  };

  const set = (k: keyof FormState, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  if (loading) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Sans', sans-serif" }}>
      Lade…
    </div>
  );

  if (loadError) return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 24, fontFamily: "'DM Sans', sans-serif" }}>
      <p style={{ color: "#f87171", textAlign: "center", fontSize: 14 }}>{loadError}</p>
      <button onClick={() => router.back()} style={{ padding: "12px 24px", borderRadius: 12, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.1)", color: "#fff", cursor: "pointer" }}>← Zurück</button>
    </div>
  );

  return (
    <div style={{ background: "#0a0a0f", minHeight: "100vh", color: "#fff", fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}>

      {/* Sticky header */}
      <div style={{
        display: "flex", alignItems: "center", gap: 12, padding: "14px 20px",
        background: "rgba(10,10,15,0.97)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        position: "sticky", top: 0, zIndex: 10,
      }}>
        <button onClick={() => router.back()} style={{
          background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, width: 36, height: 36, color: "#fff", cursor: "pointer",
          fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>←</button>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 17 }}>Firmen & Brands</span>
        <button onClick={startNew} style={{
          padding: "9px 18px", borderRadius: 12,
          background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
          color: "#fff", fontWeight: 700, fontSize: 14, cursor: "pointer",
          boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
        }}>+ Neu</button>
      </div>

      <div style={{ padding: "24px 20px 100px" }}>

        {/* Add/Edit form */}
        {editingId !== null && (
          <div style={{
            background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.2)",
            borderRadius: 20, padding: 20, marginBottom: 24,
          }}>
            <h3 style={{ margin: "0 0 20px", fontSize: 16, fontWeight: 700 }}>
              {editingId === "new" ? "Neue Firma / Brand" : "Firma bearbeiten"}
            </h3>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Name *</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="z.B. Meine GmbH" style={inp} autoFocus />
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Deine Rolle</label>
                <input value={form.role} onChange={(e) => set("role", e.target.value)} placeholder="CEO, Mitgründer…" style={inp} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Typ</label>
                <input value={form.type} onChange={(e) => set("type", e.target.value)} placeholder="SaaS, E-Commerce…" style={inp} />
              </div>
            </div>

            <div style={{ marginBottom: 14 }}>
              <label style={lbl}>Seit (Jahr)</label>
              <input value={form.year} onChange={(e) => set("year", e.target.value)} placeholder="2021" maxLength={4} style={{ ...inp, width: 100 }} />
            </div>

            {/* Status toggle */}
            <div style={{ marginBottom: 20 }}>
              <label style={lbl}>Status</label>
              <div style={{ display: "flex", gap: 8 }}>
                {[true, false].map((val) => (
                  <button key={String(val)} onClick={() => set("active", val)} style={{
                    padding: "9px 20px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer",
                    border: form.active === val
                      ? val ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(255,255,255,0.2)"
                      : "1px solid rgba(255,255,255,0.08)",
                    background: form.active === val
                      ? val ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.06)"
                      : "rgba(255,255,255,0.03)",
                    color: form.active === val
                      ? val ? "#10b981" : "rgba(255,255,255,0.5)"
                      : "rgba(255,255,255,0.25)",
                  }}>
                    {val ? "● Aktiv" : "Inaktiv"}
                  </button>
                ))}
              </div>
            </div>

            {error && <p style={{ color: "#f87171", fontSize: 13, margin: "0 0 12px" }}>{error}</p>}

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={cancel} style={{
                flex: 1, padding: "12px 0", borderRadius: 12,
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)", fontWeight: 600, fontSize: 14, cursor: "pointer",
              }}>Abbrechen</button>
              <button onClick={save} disabled={saving} style={{
                flex: 2, padding: "12px 0", borderRadius: 12,
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
                color: "#fff", fontWeight: 700, fontSize: 14, cursor: saving ? "default" : "pointer",
                opacity: saving ? 0.6 : 1, boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
              }}>{saving ? "Speichern…" : "Speichern"}</button>
            </div>
          </div>
        )}

        {/* List */}
        {companies.length === 0 && editingId === null && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🏢</div>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 16 }}>Noch keine Firmen</p>
            <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
              Füge deine erste Firma oder Brand hinzu.
            </p>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {companies.map((company) => (
            <div key={company.id} style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 16, padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 14,
            }}>
              {/* Letter avatar */}
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))",
                border: "1px solid rgba(99,102,241,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 18, fontWeight: 800, color: "#6366f1",
              }}>
                {company.name.charAt(0).toUpperCase()}
              </div>

              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontWeight: 700, fontSize: 15 }}>{company.name}</span>
                  <span style={{
                    fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 600,
                    background: company.active ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
                    border: company.active ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,255,255,0.1)",
                    color: company.active ? "#10b981" : "rgba(255,255,255,0.3)",
                  }}>
                    {company.active ? "● AKTIV" : "INAKTIV"}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
                  {[company.role, company.type, company.year ? `seit ${company.year}` : ""].filter(Boolean).join(" · ")}
                </div>
              </div>

              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => startEdit(company)} style={{
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 8, width: 32, height: 32, color: "rgba(255,255,255,0.5)",
                  cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                }}>✎</button>
                <button onClick={() => remove(company.id)} style={{
                  background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.18)",
                  borderRadius: 8, width: 32, height: 32, color: "rgba(239,68,68,0.6)",
                  cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
