"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { User, categories } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";

// ─── Types ───────────────────────────────────────────────────────────────────

type ProfileData = {
  name: string;
  username: string | null;
  role: string;
  age: number | null;
  location: string;
  bio: string;
  seeking: string;
  tags: string[];
  avatar: string;
  color: string;
  followers: number;
  is_public: boolean;
};

type Company = {
  id: number;
  name: string;
  role: string;
  type: string;
  year: string;
  active: boolean;
};

type Connection = {
  id: number;
  name: string;
  role: string;
  location: string;
  avatar: string;
  color: string;
};

type OwnProject = {
  id: number;
  title: string;
  category: string;
  model: string;
  location: string;
  status: string;
  applicants: number;
};

type ActiveTab = "Profil" | "Netzwerk" | "Einstellungen";

// ─── Settings sections ───────────────────────────────────────────────────────

type SettingsItem = {
  label: string;
  desc: string;
  action: string;
  highlight?: boolean;
  pro?: boolean;
  danger?: boolean;
  warning?: boolean;
  route?: string;
};

const SETTINGS: { title: string; icon: string; items: SettingsItem[] }[] = [
  {
    title: "Sicherheit",
    icon: "◈",
    items: [
      { label: "Passwort ändern", desc: "Neues Passwort festlegen", action: "Ändern", route: "/einstellungen/passwort" },
      { label: "Zwei-Faktor-Auth", desc: "Nicht aktiviert", action: "Aktivieren", warning: true },
      { label: "Aktive Sessions", desc: "Eingeloggte Geräte", action: "Verwalten" },
    ],
  },
  {
    title: "Abos & Zahlungen",
    icon: "◎",
    items: [
      { label: "Aktueller Plan", desc: "Free Plan — 0 CHF/Monat", action: "Upgraden", highlight: true },
      { label: "Pro Plan", desc: "Unbegrenzte Connects & Chat — 9 CHF/Monat", action: "Wählen", pro: true },
      { label: "Zahlungsmethode", desc: "Keine hinterlegt", action: "Hinzufügen" },
      { label: "Rechnungen", desc: "Keine bisherigen Zahlungen", action: "Ansehen" },
    ],
  },
  {
    title: "Datenschutz",
    icon: "◇",
    items: [
      { label: "Profil Sichtbarkeit", desc: "Öffentlich für alle", action: "Ändern", route: "/einstellungen/sichtbarkeit" },
      { label: "Daten exportieren", desc: "Alle deine Daten herunterladen", action: "Exportieren" },
      { label: "Account löschen", desc: "Konto permanent löschen", action: "Löschen", danger: true },
    ],
  },
  {
    title: "Benachrichtigungen",
    icon: "◆",
    items: [
      { label: "Push & E-Mail Einstellungen", desc: "Matches, Nachrichten, Bewerbungen", action: "Verwalten", route: "/einstellungen/benachrichtigungen" },
    ],
  },
  {
    title: "Rechtliches",
    icon: "◻",
    items: [
      { label: "AGB", desc: "Allgemeine Geschäftsbedingungen", action: "Ansehen" },
      { label: "Datenschutzerklärung", desc: "DSGVO-konforme Erklärung", action: "Ansehen" },
      { label: "Impressum", desc: "Pflichtangaben", action: "Ansehen" },
    ],
  },
];

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  currentUserId: number | null;
  onLogout: () => void;
  onOpenChat: (user: User) => void;
};

export default function ProfileDashboard({ currentUserId, onLogout, onOpenChat }: Props) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<ActiveTab>("Profil");
  const [expandedSection, setExpandedSection] = useState<string>("");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({ connections: 0, projects: 0, matches: 0 });
  const [connections, setConnections] = useState<Connection[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [myProjects, setMyProjects] = useState<OwnProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }

    const load = async () => {
      const { data: p } = await supabase
        .from("profiles")
        .select("name, username, role, age, location, bio, seeking, tags, avatar, color, followers, is_public")
        .eq("id", currentUserId)
        .single();

      if (p) {
        setProfile({
          name: p.name ?? "",
          username: p.username ?? null,
          role: p.role ?? "",
          age: p.age ?? null,
          location: p.location ?? "",
          bio: p.bio ?? "",
          seeking: p.seeking ?? "",
          tags: p.tags ?? [],
          avatar: p.avatar ?? "",
          color: p.color ?? "#6366f1",
          followers: p.followers ?? 0,
          is_public: p.is_public ?? true,
        });
      }

      const { data: companiesData } = await supabase
        .from("companies").select("*").eq("profile_id", currentUserId).order("created_at");
      setCompanies((companiesData ?? []).map((c) => ({
        id: c.id, name: c.name, role: c.role ?? "",
        type: c.type ?? "", year: c.year ?? "", active: c.active ?? true,
      })));

      const { data: projectsData, count: projectCount } = await supabase
        .from("projects")
        .select("id, title, category, model, location, status, applicants", { count: "exact" })
        .eq("user_id", currentUserId)
        .order("created_at", { ascending: false });
      setMyProjects((projectsData ?? []).map((p) => ({
        id: p.id,
        title: p.title ?? "",
        category: p.category ?? "",
        model: p.model ?? "",
        location: p.location ?? "Remote",
        status: p.status ?? "active",
        applicants: p.applicants ?? 0,
      })));

      const { data: sent } = await supabase
        .from("connections")
        .select("target_id")
        .eq("user_id", currentUserId);

      const sentIds = (sent ?? []).map((c) => c.target_id);
      let matchIds: number[] = [];
      let matchProfiles: Connection[] = [];

      if (sentIds.length > 0) {
        const { data: mutual } = await supabase
          .from("connections")
          .select("user_id")
          .eq("target_id", currentUserId)
          .in("user_id", sentIds);

        matchIds = (mutual ?? []).map((c) => c.user_id);

        if (matchIds.length > 0) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: profiles } = await supabase
            .from("profiles")
            .select("id, name, role, location, avatar, color")
            .in("id", matchIds);

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          matchProfiles = (profiles ?? []).map((mp: any) => ({
            id: mp.id, name: mp.name, role: mp.role ?? "",
            location: mp.location ?? "", avatar: mp.avatar, color: mp.color,
          }));
        }
      }

      setStats({ connections: p?.followers ?? 0, projects: projectCount ?? 0, matches: matchIds.length });
      setConnections(matchProfiles);
      setLoading(false);
    };

    load();
  }, [currentUserId, supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    onLogout();
  };

  const displayUsername = profile?.username
    ? `@${profile.username}`
    : profile?.name
    ? `@${profile.name.toLowerCase().replace(/\s+/g, "")}`
    : "@nutzer";

  if (loading) return (
    <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
      Lade Profil…
    </div>
  );

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f", minHeight: "100vh", color: "#fff", paddingBottom: 100,
    }}>
      <div style={{
        position: "fixed", top: -100, right: -100, width: 300, height: 300,
        background: "radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(160deg, rgba(99,102,241,0.1) 0%, transparent 60%)",
        padding: "32px 20px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <div style={{ position: "relative" }}>
            <Avatar
              src={profile?.avatar ?? "◉"}
              color={profile?.color ?? "#6366f1"}
              size={72} radius={20}
              style={{ boxShadow: `0 8px 24px ${profile?.color ?? "#6366f1"}44` }}
            />
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              width: 22, height: 22, borderRadius: 8,
              background: "#10b981", border: "2px solid #0a0a0f",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#fff", fontWeight: 700,
            }}>✓</div>
          </div>

          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>{profile?.name ?? "Dein Profil"}</h2>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {displayUsername}{profile?.age ? ` · ${profile.age} Jahre` : ""}
            </p>
            {profile?.location && (
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
                📍 {profile.location}
              </p>
            )}
          </div>

          <button
            onClick={() => router.push("/profil/bearbeiten")}
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", padding: "8px 14px", borderRadius: 12,
              fontSize: 13, fontWeight: 600, cursor: "pointer", flexShrink: 0,
            }}
          >
            Bearbeiten
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderRadius: 16, overflow: "hidden",
        }}>
          {[
            { label: "Follower", value: stats.connections },
            { label: "Projekte", value: stats.projects },
            { label: "Matches", value: stats.matches },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, padding: "14px 0", textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "0 20px" }}>
        {(["Profil", "Netzwerk", "Einstellungen"] as ActiveTab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: "14px 0", background: "none", border: "none", cursor: "pointer",
            fontSize: 14, fontWeight: 600,
            color: activeTab === tab ? "#6366f1" : "rgba(255,255,255,0.38)",
            borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
            transition: "all 0.15s",
          }}>{tab}</button>
        ))}
      </div>

      {/* ── PROFIL TAB ── */}
      {activeTab === "Profil" && (
        <div style={{ padding: 20 }}>
          {/* Plan badge */}
          <div style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.07))",
            border: "1px solid rgba(99,102,241,0.22)",
            borderRadius: 16, padding: 16,
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          }}>
            <span style={{ fontSize: 20 }}>✦</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Free Plan</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Upgrade für unbegrenzte Connects</div>
            </div>
            <button style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
              color: "#fff", padding: "8px 14px", borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99,102,241,0.3)",
            }}>Pro ✦</button>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={sLabel}>Über mich</h3>
            <div style={card}>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.65 }}>
                {profile?.bio || <span style={{ color: "rgba(255,255,255,0.25)" }}>Noch keine Bio — tippe auf Bearbeiten.</span>}
              </p>
            </div>
          </div>

          {/* Seeking */}
          {profile?.seeking && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={sLabel}>Sucht gerade</h3>
              <span style={{
                display: "inline-block", padding: "8px 16px", borderRadius: 20,
                background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.28)",
                color: "#6366f1", fontSize: 14, fontWeight: 600,
              }}>🔍 {profile.seeking}</span>
            </div>
          )}

          {/* Tags */}
          {(profile?.tags ?? []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={sLabel}>Skills</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(profile?.tags ?? []).map((tag) => (
                  <span key={tag} style={{
                    padding: "7px 14px", borderRadius: 20,
                    background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 13, color: "rgba(255,255,255,0.7)",
                  }}>{tag}</span>
                ))}
              </div>
            </div>
          )}

          {/* Firmen & Brands */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ ...sLabel, margin: 0 }}>Firmen & Brands</h3>
              <button onClick={() => router.push(`/profil/firmen?pid=${currentUserId}`)} style={{
                background: "none", border: "none", color: "#6366f1",
                fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0,
              }}>Verwalten →</button>
            </div>

            {companies.length === 0 ? (
              <button onClick={() => router.push(`/profil/firmen?pid=${currentUserId}`)} style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", textAlign: "center",
              }}>+ Firma oder Brand hinzufügen</button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {companies.map((company) => (
                  <div key={company.id} style={{
                    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: 14, padding: "13px 16px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                      background: "linear-gradient(135deg, rgba(99,102,241,0.25), rgba(99,102,241,0.08))",
                      border: "1px solid rgba(99,102,241,0.25)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 16, fontWeight: 800, color: "#6366f1",
                    }}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: 14 }}>{company.name}</span>
                        <span style={{
                          fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 600,
                          background: company.active ? "rgba(16,185,129,0.12)" : "rgba(255,255,255,0.05)",
                          border: company.active ? "1px solid rgba(16,185,129,0.28)" : "1px solid rgba(255,255,255,0.1)",
                          color: company.active ? "#10b981" : "rgba(255,255,255,0.3)",
                        }}>
                          {company.active ? "● AKTIV" : "INAKTIV"}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
                        {[company.role, company.type, company.year ? `seit ${company.year}` : ""].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => router.push(`/profil/firmen?pid=${currentUserId}`)} style={{
                  padding: "10px 0", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", textAlign: "center",
                }}>+ Weitere hinzufügen</button>
              </div>
            )}
          </div>

          {/* Meine Projekte */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ ...sLabel, margin: 0 }}>Meine Projekte</h3>
              <button onClick={() => router.push("/profil/projekte")} style={{
                background: "none", border: "none", color: "#6366f1",
                fontSize: 12, fontWeight: 600, cursor: "pointer", padding: 0,
              }}>Verwalten →</button>
            </div>

            {myProjects.length === 0 ? (
              <button onClick={() => router.push("/projekte/neu")} style={{
                width: "100%", padding: "16px", borderRadius: 14,
                background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.3)", fontSize: 14, cursor: "pointer", textAlign: "center",
              }}>+ Neues Projekt erstellen</button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {myProjects.map((proj) => {
                  const cat = categories.find((c) => c.id === proj.category);
                  return (
                    <button
                      key={proj.id}
                      onClick={() => router.push("/profil/projekte")}
                      style={{
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: 14, padding: "13px 16px",
                        display: "flex", alignItems: "center", gap: 12,
                        cursor: "pointer", width: "100%", textAlign: "left",
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 11, flexShrink: 0,
                        background: `linear-gradient(135deg, ${cat?.color ?? "#6366f1"}33, ${cat?.color ?? "#6366f1"}11)`,
                        border: `1px solid ${cat?.color ?? "#6366f1"}33`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 700, fontSize: 14 }}>{proj.title}</span>
                          <ProjectStatusBadge status={proj.status} />
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
                          {[cat?.label, proj.model, proj.location].filter(Boolean).join(" · ")}
                        </div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 1 }}>
                          {proj.applicants} Bewerbung{proj.applicants !== 1 ? "en" : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button onClick={() => router.push("/projekte/neu")} style={{
                  padding: "10px 0", borderRadius: 12,
                  background: "rgba(255,255,255,0.03)", border: "1px dashed rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.3)", fontSize: 13, cursor: "pointer", textAlign: "center",
                }}>+ Neues Projekt erstellen</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── NETZWERK TAB ── */}
      {activeTab === "Netzwerk" && (
        <div style={{ padding: 20 }}>
          <h3 style={{ ...sLabel, marginBottom: 16 }}>Deine Matches ({connections.length})</h3>
          {connections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🤝</div>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                Noch keine Matches. Geh zu <strong style={{ color: "#6366f1" }}>Connect</strong>!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {connections.map((conn) => (
                <div key={conn.id} style={{
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <Avatar src={conn.avatar} color={conn.color} size={46} radius={13} />
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{conn.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 1 }}>
                      {conn.role}{conn.location ? ` · ${conn.location}` : ""}
                    </div>
                  </div>
                  <button
                    onClick={() => onOpenChat({
                      id: conn.id, name: conn.name, role: conn.role,
                      location: conn.location, avatar: conn.avatar, color: conn.color,
                      age: 0, category: "", followers: 0, following: 0,
                      tags: [], bio: "", seeking: "", companies: [],
                    })}
                    style={{
                      background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)", padding: "7px 14px",
                      borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0,
                    }}
                  >💬 Chat</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EINSTELLUNGEN TAB ── */}
      {activeTab === "Einstellungen" && (
        <div style={{ padding: 20 }}>

          {/* Account section */}
          <AccordionSection
            title="Account" icon="◉"
            open={expandedSection === "__account"}
            onToggle={() => setExpandedSection(expandedSection === "__account" ? "" : "__account")}
          >
            <AccordionRow
              label="Benutzername" desc={displayUsername} action="Ändern"
              onClick={() => router.push("/einstellungen/benutzername")}
            />
            <AccordionRow
              label="Kategorie" desc={profile?.role || "Nicht angegeben"} action="Bearbeiten"
              onClick={() => router.push("/profil/bearbeiten")}
              divider
            />
          </AccordionSection>

          {SETTINGS.map((section) => (
            <AccordionSection
              key={section.title}
              title={section.title} icon={section.icon}
              open={expandedSection === section.title}
              onToggle={() => setExpandedSection(expandedSection === section.title ? "" : section.title)}
            >
              {section.items.map((item, i) => (
                <AccordionRow
                  key={item.label}
                  label={item.label} desc={item.desc} action={item.action}
                  highlight={item.highlight} pro={item.pro} danger={item.danger} warning={item.warning}
                  onClick={item.route ? () => router.push(item.route!) : undefined}
                  divider={i > 0}
                />
              ))}
            </AccordionSection>
          ))}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: "100%", marginTop: 8, padding: "14px 0",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              color: loggingOut ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.38)",
              fontSize: 14, fontWeight: 600, cursor: loggingOut ? "default" : "pointer",
            }}
          >{loggingOut ? "Abmelden…" : "Abmelden"}</button>
        </div>
      )}
    </div>
  );
}

// ─── Accordion sub-components ─────────────────────────────────────────────────

function AccordionSection({
  title, icon, open, onToggle, children,
}: {
  title: string; icon: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: open ? "14px 14px 0 0" : 14,
        padding: "14px 16px", cursor: "pointer", color: "#fff",
      }}>
        <span style={{ fontSize: 14, color: "rgba(255,255,255,0.45)" }}>{icon}</span>
        <span style={{ flex: 1, fontWeight: 700, fontSize: 15, textAlign: "left" }}>{title}</span>
        <span style={{
          fontSize: 11, color: "rgba(255,255,255,0.28)",
          display: "inline-block", transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "none",
        }}>▼</span>
      </button>
      {open && (
        <div style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.07)",
          borderTop: "none", borderRadius: "0 0 14px 14px",
        }}>
          {children}
        </div>
      )}
    </div>
  );
}

function AccordionRow({
  label, desc, action, highlight, pro, danger, warning, onClick, divider,
}: {
  label: string; desc: string; action: string;
  highlight?: boolean; pro?: boolean; danger?: boolean; warning?: boolean;
  onClick?: () => void; divider?: boolean;
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
      borderTop: divider ? "1px solid rgba(255,255,255,0.04)" : "none",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: danger ? "#ef4444" : "#fff" }}>{label}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={onClick}
        style={{
          padding: "6px 12px", borderRadius: 10, fontSize: 12, fontWeight: 600,
          cursor: onClick ? "pointer" : "default", flexShrink: 0,
          border: danger ? "1px solid rgba(239,68,68,0.3)"
            : highlight ? "none"
            : pro ? "1px solid rgba(99,102,241,0.35)"
            : warning ? "1px solid rgba(245,158,11,0.3)"
            : "1px solid rgba(255,255,255,0.1)",
          background: danger ? "rgba(239,68,68,0.1)"
            : highlight ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
            : pro ? "rgba(99,102,241,0.1)"
            : warning ? "rgba(245,158,11,0.08)"
            : "rgba(255,255,255,0.05)",
          color: danger ? "#ef4444"
            : highlight ? "#fff"
            : pro ? "#6366f1"
            : warning ? "#f59e0b"
            : "rgba(255,255,255,0.5)",
        }}
      >{action}</button>
    </div>
  );
}

// ─── Project status badge ─────────────────────────────────────────────────────

function ProjectStatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string; bg: string; border: string }> = {
    active:  { label: "● AKTIV",       color: "#10b981", bg: "rgba(16,185,129,0.12)",  border: "rgba(16,185,129,0.28)" },
    paused:  { label: "⏸ PAUSIERT",   color: "#f59e0b", bg: "rgba(245,158,11,0.12)",  border: "rgba(245,158,11,0.28)" },
    closed:  { label: "■ GESCHLOSSEN", color: "rgba(255,255,255,0.3)", bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.1)" },
  };
  const s = map[status] ?? map.active;
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 600,
      background: s.bg, border: `1px solid ${s.border}`, color: s.color,
    }}>{s.label}</span>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const sLabel: React.CSSProperties = {
  margin: "0 0 10px", fontSize: 12,
  color: "rgba(255,255,255,0.32)", textTransform: "uppercase",
  letterSpacing: 1, fontWeight: 600,
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14, padding: "14px 16px",
};
