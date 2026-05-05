"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { User } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";

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

type Connection = {
  id: number;
  name: string;
  role: string;
  location: string;
  avatar: string;
  color: string;
};

type Modal = null | "password" | "username" | "notifications" | "visibility";
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
  modalKey?: Modal;
};

const SETTINGS: { title: string; icon: string; items: SettingsItem[] }[] = [
  {
    title: "Sicherheit",
    icon: "◈",
    items: [
      { label: "Passwort ändern", desc: "Neues Passwort festlegen", action: "Ändern", modalKey: "password" },
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
      { label: "Profil Sichtbarkeit", desc: "Öffentlich für alle", action: "Ändern", modalKey: "visibility" },
      { label: "Daten exportieren", desc: "Alle deine Daten herunterladen", action: "Exportieren" },
      { label: "Account löschen", desc: "Konto permanent löschen", action: "Löschen", danger: true },
    ],
  },
  {
    title: "Benachrichtigungen",
    icon: "◆",
    items: [
      { label: "Push & E-Mail Einstellungen", desc: "Matches, Nachrichten, Bewerbungen", action: "Verwalten", modalKey: "notifications" },
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
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [modal, setModal] = useState<Modal>(null);
  const [toggles, setToggles] = useState<Record<string, boolean>>({
    "Match-Benachrichtigungen": true,
    "Neue Nachrichten": true,
    "Projekt-Bewerbungen": false,
  });

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

      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true })
        .eq("user_id", currentUserId);

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
            <div style={{
              width: 72, height: 72, borderRadius: 20,
              background: profile ? `linear-gradient(135deg, ${profile.color}, ${profile.color}88)` : "linear-gradient(135deg, #6366f1, #8b5cf6)",
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
            <div>
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
                  <div style={{
                    width: 46, height: 46, borderRadius: 13, flexShrink: 0,
                    background: `linear-gradient(135deg, ${conn.color}, ${conn.color}88)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 15,
                    boxShadow: `0 4px 12px ${conn.color}33`,
                  }}>{conn.avatar}</div>
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

          {/* Account section (dynamic username) */}
          <AccordionSection
            title="Account" icon="◉"
            open={expandedSection === "__account"}
            onToggle={() => setExpandedSection(expandedSection === "__account" ? "" : "__account")}
          >
            <AccordionRow
              label="Benutzername" desc={displayUsername} action="Ändern"
              onClick={() => setModal("username")}
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
                  onClick={item.modalKey ? () => setModal(item.modalKey!) : undefined}
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

      {/* ── Modals ── */}
      {modal === "password" && (
        <PasswordModal onClose={() => setModal(null)} />
      )}
      {modal === "username" && (
        <UsernameModal
          onClose={() => setModal(null)}
          currentUserId={currentUserId}
          current={profile?.username ?? ""}
          onSaved={(u) => {
            setProfile((p) => p ? { ...p, username: u } : p);
            setModal(null);
          }}
        />
      )}
      {modal === "notifications" && (
        <NotificationsModal
          onClose={() => setModal(null)}
          toggles={toggles}
          setToggles={setToggles}
        />
      )}
      {modal === "visibility" && (
        <VisibilityModal
          onClose={() => setModal(null)}
          currentUserId={currentUserId}
          current={profile?.is_public ?? true}
          onSaved={(v) => {
            setProfile((p) => p ? { ...p, is_public: v } : p);
            setModal(null);
          }}
        />
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

// ─── Modal components ─────────────────────────────────────────────────────────

function BottomSheet({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 800,
      background: "rgba(0,0,0,0.82)", backdropFilter: "blur(10px)",
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        background: "#13131a",
        border: "1px solid rgba(255,255,255,0.1)",
        borderRadius: "24px 24px 0 0",
        padding: "24px 20px 44px",
        width: "100%", maxWidth: 430,
        fontFamily: "'DM Sans', sans-serif",
      }}>
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: "rgba(255,255,255,0.15)",
          margin: "0 auto 20px",
        }} />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#fff" }}>{title}</h3>
          <button onClick={onClose} style={{
            background: "rgba(255,255,255,0.08)", border: "none",
            color: "#fff", width: 32, height: 32, borderRadius: 10, cursor: "pointer", fontSize: 16,
          }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

const mInput: React.CSSProperties = {
  width: "100%", background: "rgba(255,255,255,0.07)",
  border: "1px solid rgba(255,255,255,0.1)", borderRadius: 14,
  padding: "13px 16px", color: "#fff", fontSize: 15, outline: "none",
  boxSizing: "border-box", fontFamily: "'DM Sans', sans-serif",
};
const mLabel: React.CSSProperties = {
  fontSize: 12, color: "rgba(255,255,255,0.38)", textTransform: "uppercase",
  letterSpacing: 1, display: "block", marginBottom: 8, fontWeight: 600,
};
const mBtn: React.CSSProperties = {
  width: "100%", padding: "14px 0", borderRadius: 14,
  background: "linear-gradient(135deg, #6366f1, #8b5cf6)", border: "none",
  color: "#fff", fontWeight: 700, fontSize: 16, cursor: "pointer",
  boxShadow: "0 4px 16px rgba(99,102,241,0.3)", marginTop: 8,
};

// ── Password ──
function PasswordModal({ onClose }: { onClose: () => void }) {
  const supabase = useMemo(() => createClient(), []);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const save = async () => {
    if (!currentPw) { setError("Bitte aktuelles Passwort eingeben."); return; }
    if (newPw.length < 6) { setError("Neues Passwort muss mindestens 6 Zeichen haben."); return; }
    if (newPw !== confirmPw) { setError("Passwörter stimmen nicht überein."); return; }
    setLoading(true);
    setError("");

    // Verify current password via re-auth
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.email) {
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email, password: currentPw,
      });
      if (authErr) {
        setError("Aktuelles Passwort ist falsch.");
        setLoading(false);
        return;
      }
    }

    const { error: updateErr } = await supabase.auth.updateUser({ password: newPw });
    setLoading(false);
    if (updateErr) { setError(updateErr.message); }
    else { setDone(true); setTimeout(onClose, 1500); }
  };

  return (
    <BottomSheet title="Passwort ändern" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: "center", padding: "16px 0" }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <p style={{ color: "#10b981", fontWeight: 700 }}>Passwort geändert!</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 16 }}>
            <label style={mLabel}>Aktuelles Passwort</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} style={mInput} placeholder="••••••••" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={mLabel}>Neues Passwort</label>
            <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} style={mInput} placeholder="••••••••" />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={mLabel}>Passwort bestätigen</label>
            <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && save()}
              style={mInput} placeholder="••••••••" />
          </div>
          {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{error}</p>}
          <button onClick={save} disabled={loading} style={{ ...mBtn, opacity: loading ? 0.7 : 1 }}>
            {loading ? "Prüfe…" : "Passwort ändern"}
          </button>
        </>
      )}
    </BottomSheet>
  );
}

// ── Username ──
function UsernameModal({ onClose, currentUserId, current, onSaved }: {
  onClose: () => void; currentUserId: number | null; current: string; onSaved: (u: string) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [value, setValue] = useState(current);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const save = async () => {
    if (!currentUserId) return;
    const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, "").trim();
    if (!clean) { setError("Benutzername darf nicht leer sein."); return; }
    setLoading(true);
    setError("");
    const { error: err } = await supabase
      .from("profiles")
      .update({ username: clean })
      .eq("id", currentUserId);
    setLoading(false);
    if (err) {
      setError(err.code === "23505" ? "Dieser Name ist bereits vergeben." : err.message);
    } else {
      onSaved(clean);
    }
  };

  return (
    <BottomSheet title="Benutzername ändern" onClose={onClose}>
      <div style={{ marginBottom: 20 }}>
        <label style={mLabel}>Benutzername</label>
        <div style={{ position: "relative" }}>
          <span style={{
            position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
            color: "rgba(255,255,255,0.35)", fontSize: 15, pointerEvents: "none",
          }}>@</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && save()}
            placeholder="benutzername"
            style={{ ...mInput, paddingLeft: 32 }}
            autoFocus
          />
        </div>
        <p style={{ margin: "8px 0 0", fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
          Nur Kleinbuchstaben, Zahlen und _
        </p>
      </div>
      {error && <p style={{ color: "#f87171", fontSize: 13, marginBottom: 8 }}>{error}</p>}
      <button onClick={save} disabled={loading} style={{ ...mBtn, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Speichere…" : "Speichern"}
      </button>
    </BottomSheet>
  );
}

// ── Notifications ──
function NotificationsModal({ onClose, toggles, setToggles }: {
  onClose: () => void;
  toggles: Record<string, boolean>;
  setToggles: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}) {
  const items = [
    { key: "Match-Benachrichtigungen", label: "Match-Benachrichtigungen", desc: "Wenn jemand zurück-connected" },
    { key: "Neue Nachrichten", label: "Neue Nachrichten", desc: "Chat-Nachrichten per Push & E-Mail" },
    { key: "Projekt-Bewerbungen", label: "Projekt-Bewerbungen", desc: "Bewerbungen auf deine Projekte" },
  ];

  return (
    <BottomSheet title="Benachrichtigungen" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 24 }}>
        {items.map((item, i) => (
          <div key={item.key} style={{
            display: "flex", alignItems: "center", gap: 12,
            padding: "14px 0",
            borderBottom: i < items.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
          }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 15, color: "#fff" }}>{item.label}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{item.desc}</div>
            </div>
            <button
              onClick={() => setToggles((p) => ({ ...p, [item.key]: !p[item.key] }))}
              style={{
                width: 48, height: 28, borderRadius: 14, flexShrink: 0,
                background: toggles[item.key] ? "#6366f1" : "rgba(255,255,255,0.1)",
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.2s",
              }}
            >
              <div style={{
                width: 22, height: 22, borderRadius: "50%", background: "#fff",
                position: "absolute", top: 3,
                left: toggles[item.key] ? 23 : 3,
                transition: "left 0.2s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
              }} />
            </button>
          </div>
        ))}
      </div>
      <button onClick={onClose} style={mBtn}>Fertig</button>
    </BottomSheet>
  );
}

// ── Visibility ──
function VisibilityModal({ onClose, currentUserId, current, onSaved }: {
  onClose: () => void; currentUserId: number | null; current: boolean; onSaved: (v: boolean) => void;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [selected, setSelected] = useState<"public" | "private">(current ? "public" : "private");
  const [loading, setLoading] = useState(false);

  const options = [
    { key: "public" as const, label: "Öffentlich", desc: "Alle Nutzer können dein Profil sehen", icon: "🌍" },
    { key: "private" as const, label: "Privat", desc: "Nur Matches können dein Profil sehen", icon: "🔒" },
  ];

  const save = async () => {
    if (!currentUserId) return;
    setLoading(true);
    const isPublic = selected === "public";
    const { error } = await supabase
      .from("profiles")
      .update({ is_public: isPublic })
      .eq("id", currentUserId);
    setLoading(false);
    if (!error) onSaved(isPublic);
  };

  return (
    <BottomSheet title="Profil Sichtbarkeit" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
        {options.map((opt) => {
          const active = selected === opt.key;
          return (
            <button
              key={opt.key}
              onClick={() => setSelected(opt.key)}
              style={{
                display: "flex", alignItems: "center", gap: 14,
                padding: "16px",
                background: active ? "rgba(99,102,241,0.12)" : "rgba(255,255,255,0.04)",
                border: active ? "1px solid rgba(99,102,241,0.4)" : "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, cursor: "pointer", textAlign: "left",
                transition: "all 0.15s",
              }}
            >
              <span style={{ fontSize: 24 }}>{opt.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 15, color: active ? "#6366f1" : "#fff" }}>{opt.label}</div>
                <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{opt.desc}</div>
              </div>
              <div style={{
                width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                border: active ? "none" : "2px solid rgba(255,255,255,0.2)",
                background: active ? "#6366f1" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, color: "#fff",
              }}>{active ? "✓" : ""}</div>
            </button>
          );
        })}
      </div>
      <button onClick={save} disabled={loading} style={{ ...mBtn, opacity: loading ? 0.7 : 1 }}>
        {loading ? "Speichere…" : "Speichern"}
      </button>
    </BottomSheet>
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
