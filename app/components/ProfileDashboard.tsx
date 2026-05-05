"use client";

import { useEffect, useMemo, useState } from "react";
import { User } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";

type ProfileData = {
  name: string;
  role: string;
  age: number | null;
  location: string;
  bio: string;
  seeking: string;
  tags: string[];
  avatar: string;
  color: string;
  followers: number;
};

type Connection = {
  id: number;
  name: string;
  role: string;
  location: string;
  avatar: string;
  color: string;
};

type SettingsItem = {
  label: string;
  desc: string;
  action: string;
  highlight?: boolean;
  pro?: boolean;
  danger?: boolean;
  toggle?: boolean;
  warning?: boolean;
};

type SettingsSection = {
  title: string;
  icon: string;
  items: SettingsItem[];
};

const SETTINGS_SECTIONS: SettingsSection[] = [
  {
    title: "Profil",
    icon: "◉",
    items: [
      { label: "Bio & Skills", desc: "Beschreibe dich und deine Skills", action: "Bearbeiten" },
      { label: "Ventures & Brands", desc: "Deine Unternehmen verwalten", action: "Verwalten" },
    ],
  },
  {
    title: "Sicherheit",
    icon: "◈",
    items: [
      { label: "Passwort ändern", desc: "Zuletzt geändert vor 30 Tagen", action: "Ändern" },
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
      { label: "Profil Sichtbarkeit", desc: "Öffentlich für alle", action: "Ändern" },
      { label: "Daten exportieren", desc: "Alle deine Daten herunterladen", action: "Exportieren" },
      { label: "Account löschen", desc: "Konto permanent löschen", action: "Löschen", danger: true },
    ],
  },
  {
    title: "Benachrichtigungen",
    icon: "◆",
    items: [
      { label: "Match-Benachrichtigungen", desc: "Push & Email", action: "toggle", toggle: true },
      { label: "Neue Nachrichten", desc: "Push & Email", action: "toggle", toggle: true },
      { label: "Projekt-Bewerbungen", desc: "Nur Email", action: "toggle", toggle: true },
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

type Props = {
  currentUserId: number | null;
  onLogout: () => void;
  onOpenChat: (user: User) => void;
};

type ActiveTab = "Profil" | "Netzwerk" | "Einstellungen";

export default function ProfileDashboard({ currentUserId, onLogout, onOpenChat }: Props) {
  const supabase = useMemo(() => createClient(), []);

  const [activeTab, setActiveTab] = useState<ActiveTab>("Profil");
  const [expandedSection, setExpandedSection] = useState<string>("Profil");
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [stats, setStats] = useState({ connections: 0, projects: 0, matches: 0 });
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Match-Benachrichtigungen": true,
    "Neue Nachrichten": true,
    "Projekt-Bewerbungen": false,
  });

  useEffect(() => {
    if (!currentUserId) { setLoading(false); return; }

    const load = async () => {
      // Full profile
      const { data: p } = await supabase
        .from("profiles")
        .select("name, role, age, location, bio, seeking, tags, avatar, color, followers")
        .eq("id", currentUserId)
        .single();

      if (p) {
        setProfile({
          name: p.name ?? "",
          role: p.role ?? "",
          age: p.age ?? null,
          location: p.location ?? "",
          bio: p.bio ?? "",
          seeking: p.seeking ?? "",
          tags: p.tags ?? [],
          avatar: p.avatar ?? "",
          color: p.color ?? "#6366f1",
          followers: p.followers ?? 0,
        });
      }

      // Projects count
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUserId);

      // Mutual connections (matches)
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
            id: mp.id,
            name: mp.name,
            role: mp.role ?? "",
            location: mp.location ?? "",
            avatar: mp.avatar,
            color: mp.color,
          }));
        }
      }

      setStats({
        connections: p?.followers ?? 0,
        projects: projectCount ?? 0,
        matches: matchIds.length,
      });
      setConnections(matchProfiles);
      setLoading(false);
    };

    load();
  }, [currentUserId, supabase]);

  const handleLogout = async () => {
    setLoggingOut(true);
    onLogout();
  };

  const username = profile
    ? "@" + profile.name.toLowerCase().replace(/\s+/g, "")
    : "@nutzer";

  if (loading) {
    return (
      <div style={{ padding: 60, textAlign: "center", color: "rgba(255,255,255,0.25)", fontSize: 14 }}>
        Lade Profil…
      </div>
    );
  }

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      paddingBottom: 100,
    }}>
      {/* Glow */}
      <div style={{
        position: "fixed", top: -100, right: -100, width: 300, height: 300,
        background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* ── Header ── */}
      <div style={{
        background: "linear-gradient(160deg, rgba(99,102,241,0.12) 0%, transparent 60%)",
        padding: "32px 20px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          {/* Avatar */}
          <div style={{ position: "relative" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: profile
                ? `linear-gradient(135deg, ${profile.color}, ${profile.color}88)`
                : "linear-gradient(135deg, #6366f1, #8b5cf6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 24, fontWeight: 700,
              boxShadow: `0 8px 24px ${profile?.color ?? "#6366f1"}44`,
            }}>
              {profile?.avatar ?? "◉"}
            </div>
            <div style={{
              position: "absolute", bottom: -4, right: -4,
              width: 22, height: 22, borderRadius: 8,
              background: "#10b981", border: "2px solid #0a0a0f",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, color: "#fff", fontWeight: 700,
            }}>✓</div>
          </div>

          {/* Name + meta */}
          <div style={{ flex: 1 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800 }}>
              {profile?.name ?? "Dein Profil"}
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
              {username}{profile?.age ? ` · ${profile.age} Jahre` : ""}
            </p>
            {profile?.location && (
              <p style={{ margin: "2px 0 0", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                📍 {profile.location}
              </p>
            )}
          </div>

          <button style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#fff", padding: "8px 14px", borderRadius: 12,
            fontSize: 13, cursor: "pointer", fontWeight: 600,
            flexShrink: 0,
          }}>
            Bearbeiten
          </button>
        </div>

        {/* Stats bar */}
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
          ].map((stat, i) => (
            <div key={stat.label} style={{
              flex: 1, padding: "14px 0", textAlign: "center",
              borderRight: i < 2 ? "1px solid rgba(255,255,255,0.07)" : "none",
            }}>
              <div style={{ fontSize: 20, fontWeight: 800 }}>{stat.value}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{
        display: "flex",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "0 20px",
      }}>
        {(["Profil", "Netzwerk", "Einstellungen"] as ActiveTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              flex: 1, padding: "14px 0",
              background: "none", border: "none",
              cursor: "pointer", fontSize: 14, fontWeight: 600,
              color: activeTab === tab ? "#6366f1" : "rgba(255,255,255,0.4)",
              borderBottom: activeTab === tab ? "2px solid #6366f1" : "2px solid transparent",
              transition: "all 0.15s",
            }}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── PROFIL TAB ── */}
      {activeTab === "Profil" && (
        <div style={{ padding: 20 }}>
          {/* Plan badge */}
          <div style={{
            background: "linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08))",
            border: "1px solid rgba(99,102,241,0.25)",
            borderRadius: 16, padding: 16,
            display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
          }}>
            <span style={{ fontSize: 20 }}>✦</span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 15 }}>Free Plan</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.45)" }}>
                Upgrade für unbegrenzte Connects
              </div>
            </div>
            <button style={{
              background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              border: "none", color: "#fff",
              padding: "8px 14px", borderRadius: 10,
              fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 12px rgba(99,102,241,0.35)",
            }}>
              Pro ✦
            </button>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={sectionLabel}>Über mich</h3>
            <div style={card}>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.7)", lineHeight: 1.65 }}>
                {profile?.bio || "Noch keine Bio hinterlegt."}
              </p>
            </div>
          </div>

          {/* Seeking */}
          {profile?.seeking && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={sectionLabel}>Sucht gerade</h3>
              <span style={{
                display: "inline-block",
                padding: "8px 16px", borderRadius: 20,
                background: "rgba(99,102,241,0.12)",
                border: "1px solid rgba(99,102,241,0.28)",
                color: "#6366f1", fontSize: 14, fontWeight: 600,
              }}>
                🔍 {profile.seeking}
              </span>
            </div>
          )}

          {/* Skills / Tags */}
          {(profile?.tags ?? []).length > 0 && (
            <div>
              <h3 style={sectionLabel}>Skills</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {(profile?.tags ?? []).map((tag) => (
                  <span key={tag} style={{
                    padding: "7px 14px", borderRadius: 20,
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: 13, color: "rgba(255,255,255,0.7)",
                  }}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── NETZWERK TAB ── */}
      {activeTab === "Netzwerk" && (
        <div style={{ padding: 20 }}>
          <h3 style={{ ...sectionLabel, marginBottom: 16 }}>
            Deine Matches ({connections.length})
          </h3>

          {connections.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <div style={{ fontSize: 40, marginBottom: 14 }}>🤝</div>
              <p style={{ margin: 0, fontSize: 14, color: "rgba(255,255,255,0.35)", lineHeight: 1.6 }}>
                Noch keine Matches. Geh zu <strong style={{ color: "#6366f1" }}>Connect</strong> und schicke Anfragen!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {connections.map((conn) => (
                <div key={conn.id} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                  borderRadius: 16, padding: "14px 16px",
                  display: "flex", alignItems: "center", gap: 12,
                }}>
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    background: `linear-gradient(135deg, ${conn.color}, ${conn.color}88)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 15,
                    boxShadow: `0 4px 12px ${conn.color}33`,
                  }}>
                    {conn.avatar}
                  </div>
                  <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{ fontWeight: 700, fontSize: 15 }}>{conn.name}</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>
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
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "rgba(255,255,255,0.6)",
                      padding: "7px 14px", borderRadius: 10,
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                      flexShrink: 0,
                    }}
                  >
                    💬 Chat
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EINSTELLUNGEN TAB ── */}
      {activeTab === "Einstellungen" && (
        <div style={{ padding: 20 }}>
          {/* Benutzername section (dynamic) */}
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={() => setExpandedSection(expandedSection === "__account" ? "" : "__account")}
              style={accordionHeader(expandedSection === "__account")}
            >
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>◉</span>
              <span style={{ flex: 1, fontWeight: 700, fontSize: 15, textAlign: "left" }}>Account</span>
              <span style={{
                fontSize: 11, color: "rgba(255,255,255,0.3)",
                display: "inline-block",
                transform: expandedSection === "__account" ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}>▼</span>
            </button>
            {expandedSection === "__account" && (
              <div style={accordionBody}>
                <div style={accordionRow}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Benutzername</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      {username}
                    </div>
                  </div>
                  <ActionButton label="Bearbeiten" />
                </div>
                <div style={{ ...accordionRow, borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>Kategorie</div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                      {profile?.role ?? "Nicht angegeben"}
                    </div>
                  </div>
                  <ActionButton label="Ändern" />
                </div>
              </div>
            )}
          </div>

          {SETTINGS_SECTIONS.map((section) => (
            <div key={section.title} style={{ marginBottom: 10 }}>
              <button
                onClick={() => setExpandedSection(expandedSection === section.title ? "" : section.title)}
                style={accordionHeader(expandedSection === section.title)}
              >
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)" }}>{section.icon}</span>
                <span style={{ flex: 1, fontWeight: 700, fontSize: 15, textAlign: "left" }}>
                  {section.title}
                </span>
                <span style={{
                  fontSize: 11, color: "rgba(255,255,255,0.3)",
                  display: "inline-block",
                  transform: expandedSection === section.title ? "rotate(180deg)" : "none",
                  transition: "transform 0.2s",
                }}>▼</span>
              </button>

              {expandedSection === section.title && (
                <div style={accordionBody}>
                  {section.items.map((item, i) => (
                    <div key={item.label} style={{
                      ...accordionRow,
                      borderTop: i > 0 ? "1px solid rgba(255,255,255,0.04)" : "none",
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          fontSize: 14, fontWeight: 600,
                          color: item.danger ? "#ef4444" : "#fff",
                        }}>
                          {item.label}
                        </div>
                        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)", marginTop: 2 }}>
                          {item.desc}
                        </div>
                      </div>

                      {item.toggle ? (
                        <button
                          onClick={() => setToggles((prev) => ({ ...prev, [item.label]: !prev[item.label] }))}
                          style={{
                            width: 44, height: 26, borderRadius: 13,
                            background: toggles[item.label] ? "#6366f1" : "rgba(255,255,255,0.1)",
                            border: "none", cursor: "pointer", position: "relative",
                            flexShrink: 0, transition: "background 0.2s",
                          }}
                        >
                          <div style={{
                            width: 20, height: 20, borderRadius: "50%",
                            background: "#fff",
                            position: "absolute", top: 3,
                            left: toggles[item.label] ? 21 : 3,
                            transition: "left 0.2s",
                            boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                          }} />
                        </button>
                      ) : (
                        <button style={{
                          padding: "6px 12px", borderRadius: 10,
                          fontSize: 12, fontWeight: 600, cursor: "pointer",
                          flexShrink: 0,
                          border: item.danger
                            ? "1px solid rgba(239,68,68,0.3)"
                            : item.highlight
                            ? "none"
                            : item.pro
                            ? "1px solid rgba(99,102,241,0.35)"
                            : item.warning
                            ? "1px solid rgba(245,158,11,0.35)"
                            : "1px solid rgba(255,255,255,0.1)",
                          background: item.danger
                            ? "rgba(239,68,68,0.1)"
                            : item.highlight
                            ? "linear-gradient(135deg, #6366f1, #8b5cf6)"
                            : item.pro
                            ? "rgba(99,102,241,0.12)"
                            : item.warning
                            ? "rgba(245,158,11,0.1)"
                            : "rgba(255,255,255,0.05)",
                          color: item.danger
                            ? "#ef4444"
                            : item.highlight
                            ? "#fff"
                            : item.pro
                            ? "#6366f1"
                            : item.warning
                            ? "#f59e0b"
                            : "rgba(255,255,255,0.55)",
                        }}>
                          {item.action}
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {/* Logout */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            style={{
              width: "100%", marginTop: 8, padding: "14px 0",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14,
              color: loggingOut ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)",
              fontSize: 14, fontWeight: 600, cursor: loggingOut ? "default" : "pointer",
            }}
          >
            {loggingOut ? "Abmelden…" : "Abmelden"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── Shared style helpers ─────────────────────────────────────────────────────

const sectionLabel: React.CSSProperties = {
  margin: "0 0 10px",
  fontSize: 12,
  color: "rgba(255,255,255,0.35)",
  textTransform: "uppercase",
  letterSpacing: 1,
  fontWeight: 600,
};

const card: React.CSSProperties = {
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderRadius: 14,
  padding: "14px 16px",
};

function accordionHeader(open: boolean): React.CSSProperties {
  return {
    width: "100%",
    display: "flex",
    alignItems: "center",
    gap: 10,
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: open ? "14px 14px 0 0" : 14,
    padding: "14px 16px",
    cursor: "pointer",
    color: "#fff",
  };
}

const accordionBody: React.CSSProperties = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(255,255,255,0.07)",
  borderTop: "none",
  borderRadius: "0 0 14px 14px",
};

const accordionRow: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  padding: "14px 16px",
};

function ActionButton({ label }: { label: string }) {
  return (
    <button style={{
      padding: "6px 12px", borderRadius: 10,
      fontSize: 12, fontWeight: 600, cursor: "pointer",
      flexShrink: 0,
      border: "1px solid rgba(255,255,255,0.1)",
      background: "rgba(255,255,255,0.05)",
      color: "rgba(255,255,255,0.55)",
    }}>
      {label}
    </button>
  );
}
