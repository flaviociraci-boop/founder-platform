"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Users } from "lucide-react";
import { User, categories } from "@/app/lib/data";
import { createClient } from "@/utils/supabase/client";
import { Avatar } from "@/app/components/Avatar";
import { Tag } from "@/app/components/Tag";

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

const SETTINGS: { title: string; items: SettingsItem[] }[] = [
  {
    title: "Sicherheit",
    items: [
      { label: "Passwort ändern", desc: "Neues Passwort festlegen", action: "Ändern", route: "/einstellungen/passwort" },
      { label: "Zwei-Faktor-Auth", desc: "Nicht aktiviert", action: "Aktivieren", warning: true },
      { label: "Aktive Sessions", desc: "Eingeloggte Geräte", action: "Verwalten" },
    ],
  },
  {
    title: "Datenschutz",
    items: [
      { label: "Profil Sichtbarkeit", desc: "Öffentlich für alle", action: "Ändern", route: "/einstellungen/sichtbarkeit" },
      { label: "Daten exportieren", desc: "Alle deine Daten herunterladen", action: "Exportieren" },
      { label: "Account löschen", desc: "Konto permanent löschen", action: "Löschen", danger: true, route: "/einstellungen/account-loeschen" },
    ],
  },
  {
    title: "Benachrichtigungen",
    items: [
      { label: "Push & E-Mail Einstellungen", desc: "Matches, Nachrichten, Bewerbungen", action: "Verwalten", route: "/einstellungen/benachrichtigungen" },
    ],
  },
  {
    title: "Rechtliches",
    items: [
      { label: "AGB", desc: "Allgemeine Geschäftsbedingungen", action: "Ansehen", route: "/agb" },
      { label: "Datenschutzerklärung", desc: "DSGVO-konforme Erklärung", action: "Ansehen", route: "/datenschutz" },
      { label: "Impressum", desc: "Pflichtangaben", action: "Ansehen", route: "/impressum" },
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

      // Bidirektional zählen: ein Match = EINE Row in connections (vom
      // Sender), status='accepted'. Partner-ID = die andere Seite, je
      // nachdem ob ich Sender oder Empfänger war. Gleiches Pattern wie
      // ChatsScreen.tsx — Konsistenz mit dem Match/Chat-Listing.
      const { data: accepted } = await supabase
        .from("connections")
        .select("user_id, target_id")
        .eq("status", "accepted")
        .or(`user_id.eq.${currentUserId},target_id.eq.${currentUserId}`);

      const matchIds = (accepted ?? []).map((c) =>
        c.user_id === currentUserId ? c.target_id : c.user_id,
      );
      let matchProfiles: Connection[] = [];

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
      fontFamily: "var(--font-sans)",
      background: "var(--background)", minHeight: "100vh", color: "var(--foreground)", paddingBottom: 100,
    }}>
      {/* ── Header ── */}
      <div style={{
        padding: "32px 20px 24px",
        borderBottom: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16, marginBottom: 20 }}>
          <Avatar
            src={profile?.avatar ?? "◉"}
            color={profile?.color ?? "#6366f1"}
            size={64} radius={14} shadow={false}
          />

          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>{profile?.name ?? "Dein Profil"}</h2>
            <p style={{ margin: "3px 0 0", fontSize: 13, color: "var(--text-dim)" }}>
              {displayUsername}{profile?.age ? ` · ${profile.age} Jahre` : ""}
            </p>
            {profile?.location && (
              <p style={{
                margin: "2px 0 0", fontSize: 13, color: "var(--text-dim)",
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <MapPin size={13} color="var(--text-dim)" strokeWidth={2} />
                {profile.location}
              </p>
            )}
          </div>

          <button
            onClick={() => router.push("/profil/bearbeiten")}
            style={{
              background: "var(--surface-2)",
              border: "1px solid var(--border)",
              color: "var(--foreground)", padding: "7px 13px", borderRadius: "var(--radius-button)",
              fontSize: 13, fontWeight: 500, cursor: "pointer", flexShrink: 0,
            }}
          >
            Bearbeiten
          </button>
        </div>

        {/* Stats */}
        <div style={{
          display: "flex",
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-card)", overflow: "hidden",
        }}>
          {[
            { label: "Follower", value: stats.connections },
            { label: "Projekte", value: stats.projects },
            { label: "Matches", value: stats.matches },
          ].map((s, i) => (
            <div key={s.label} style={{
              flex: 1, padding: "12px 0", textAlign: "center",
              borderRight: i < 2 ? "1px solid var(--border)" : "none",
            }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: "var(--text-dim)", marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--border)", padding: "0 20px" }}>
        {(["Profil", "Netzwerk", "Einstellungen"] as ActiveTab[]).map((tab) => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            flex: 1, padding: "14px 0", background: "none", border: "none", cursor: "pointer",
            fontSize: 13.5, fontWeight: 500,
            color: activeTab === tab ? "var(--foreground)" : "var(--text-dim)",
            borderBottom: activeTab === tab ? "2px solid var(--brand)" : "2px solid transparent",
            transition: "all 0.15s",
          }}>{tab}</button>
        ))}
      </div>

      {/* ── PROFIL TAB ── */}
      {activeTab === "Profil" && (
        <div style={{ padding: 20 }}>
          {/* Bio */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={sLabel}>Über mich</h3>
            <div style={card}>
              <p style={{ margin: 0, fontSize: 14, color: "var(--text-muted)", lineHeight: 1.6 }}>
                {profile?.bio || <span style={{ color: "var(--text-faint)" }}>Noch keine Bio — tippe auf Bearbeiten.</span>}
              </p>
            </div>
          </div>

          {/* Seeking */}
          {profile?.seeking && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={sLabel}>Sucht gerade</h3>
              <Tag size="md">{profile.seeking}</Tag>
            </div>
          )}

          {/* Tags */}
          {(profile?.tags ?? []).length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h3 style={sLabel}>Skills</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(profile?.tags ?? []).map((tag) => (
                  <Tag key={tag} size="md">{tag}</Tag>
                ))}
              </div>
            </div>
          )}

          {/* Firmen & Brands */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ ...sLabel, margin: 0 }}>Firmen & Brands</h3>
              <button onClick={() => router.push(`/profil/firmen?pid=${currentUserId}`)} style={{
                background: "none", border: "none", color: "var(--brand)",
                fontSize: 12, fontWeight: 500, cursor: "pointer", padding: 0,
              }}>Verwalten →</button>
            </div>

            {companies.length === 0 ? (
              <button onClick={() => router.push(`/profil/firmen?pid=${currentUserId}`)} style={dashedAddBtn}>
                + Firma oder Brand hinzufügen
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {companies.map((company) => (
                  <div key={company.id} style={{
                    background: "var(--surface-1)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-card)", padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                      background: "var(--avatar-placeholder)",
                      border: "1px solid var(--border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 14, fontWeight: 600, color: "var(--avatar-placeholder-text)",
                    }}>
                      {company.name.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 600, fontSize: 14 }}>{company.name}</span>
                        {company.active && (
                          <span style={{
                            fontSize: 10, padding: "2px 7px", borderRadius: "var(--radius-tag)", fontWeight: 600,
                            background: "var(--brand-soft)",
                            color: "var(--foreground)",
                            letterSpacing: 0.4,
                          }}>
                            AKTIV
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                        {[company.role, company.type, company.year ? `seit ${company.year}` : ""].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                ))}
                <button onClick={() => router.push(`/profil/firmen?pid=${currentUserId}`)} style={dashedAddBtn}>
                  + Weitere hinzufügen
                </button>
              </div>
            )}
          </div>

          {/* Meine Projekte */}
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <h3 style={{ ...sLabel, margin: 0 }}>Meine Projekte</h3>
              <button onClick={() => router.push("/profil/projekte")} style={{
                background: "none", border: "none", color: "var(--brand)",
                fontSize: 12, fontWeight: 500, cursor: "pointer", padding: 0,
              }}>Verwalten →</button>
            </div>

            {myProjects.length === 0 ? (
              <button onClick={() => router.push("/projekte/neu")} style={dashedAddBtn}>
                + Neues Projekt erstellen
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {myProjects.map((proj) => {
                  const cat = categories.find((c) => c.id === proj.category);
                  return (
                    <button
                      key={proj.id}
                      onClick={() => router.push("/profil/projekte")}
                      style={{
                        background: "var(--surface-1)", border: "1px solid var(--border)",
                        borderRadius: "var(--radius-card)", padding: "12px 14px",
                        display: "flex", alignItems: "center", gap: 12,
                        cursor: "pointer", width: "100%", textAlign: "left",
                      }}
                    >
                      <div style={{
                        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
                        background: "var(--avatar-placeholder)",
                        border: "1px solid var(--border)",
                      }} />
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>{proj.title}</span>
                          <ProjectStatusBadge status={proj.status} />
                        </div>
                        <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                          {[cat?.label, proj.model, proj.location].filter(Boolean).join(" · ")}
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 1 }}>
                          {proj.applicants} Bewerbung{proj.applicants !== 1 ? "en" : ""}
                        </div>
                      </div>
                    </button>
                  );
                })}
                <button onClick={() => router.push("/projekte/neu")} style={dashedAddBtn}>
                  + Neues Projekt erstellen
                </button>
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
              <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
                <Users size={40} color="var(--text-dim)" strokeWidth={1.5} />
              </div>
              <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
                Noch keine Matches. Geh zu <strong style={{ color: "var(--brand)" }}>Connect</strong>!
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {connections.map((conn) => {
                const sub = [conn.role, conn.location].filter(Boolean).join(" · ");
                return (
                  <div key={conn.id} style={{
                    background: "var(--surface-1)", border: "1px solid var(--border)",
                    borderRadius: "var(--radius-card)", padding: "12px 14px",
                    display: "flex", alignItems: "center", gap: 12,
                  }}>
                    <Avatar src={conn.avatar} color={conn.color} size={40} radius={10} shadow={false} />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontWeight: 600, fontSize: 14 }}>{conn.name}</div>
                      {sub && (
                        <div style={{ fontSize: 12.5, color: "var(--text-dim)", marginTop: 2 }}>
                          {sub}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => onOpenChat({
                        id: conn.id, name: conn.name, role: conn.role,
                        location: conn.location, avatar: conn.avatar, color: conn.color,
                        age: 0, category: "", followers: 0, following: 0,
                        tags: [], bio: "", seeking: "", companies: [],
                      })}
                      style={{
                        background: "var(--surface-2)", border: "1px solid var(--border)",
                        color: "var(--foreground)", padding: "7px 13px",
                        borderRadius: "var(--radius-button)", fontSize: 12, fontWeight: 500, cursor: "pointer", flexShrink: 0,
                      }}
                    >Chat</button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── EINSTELLUNGEN TAB ── */}
      {activeTab === "Einstellungen" && (
        <div style={{ padding: 20 }}>

          {/* Account section */}
          <AccordionSection
            title="Account"
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
              title={section.title}
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
              width: "100%", marginTop: 8, padding: "12px 0",
              background: "transparent", border: "1px solid var(--border)",
              borderRadius: "var(--radius-button)",
              color: loggingOut ? "var(--text-faint)" : "var(--text-muted)",
              fontSize: 14, fontWeight: 500, cursor: loggingOut ? "default" : "pointer",
            }}
          >{loggingOut ? "Abmelden…" : "Abmelden"}</button>
        </div>
      )}
    </div>
  );
}

// ─── Accordion sub-components ─────────────────────────────────────────────────

function AccordionSection({
  title, open, onToggle, children,
}: {
  title: string; open: boolean; onToggle: () => void; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <button onClick={onToggle} style={{
        width: "100%", display: "flex", alignItems: "center", gap: 10,
        background: "var(--surface-1)",
        border: "1px solid var(--border)",
        borderRadius: open ? "var(--radius-card) var(--radius-card) 0 0" : "var(--radius-card)",
        padding: "13px 14px", cursor: "pointer", color: "var(--foreground)",
      }}>
        <span style={{ flex: 1, fontWeight: 600, fontSize: 14, textAlign: "left" }}>{title}</span>
        <span style={{
          fontSize: 11, color: "var(--text-dim)",
          display: "inline-block", transition: "transform 0.2s",
          transform: open ? "rotate(180deg)" : "none",
        }}>▼</span>
      </button>
      {open && (
        <div style={{
          background: "var(--surface-1)",
          border: "1px solid var(--border)",
          borderTop: "none", borderRadius: "0 0 var(--radius-card) var(--radius-card)",
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
  // Variants kollabieren: highlight = brand-fill (primary CTA),
  // danger = roter Outline, alle anderen (pro/warning/default) = einheitlicher
  // neutraler Outline. "pro" und "warning" verlieren ihre Sonderfarben weil
  // dies Slop war — semantische Differenzierung steht im desc-Text.
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 12, padding: "13px 14px",
      borderTop: divider ? "1px solid var(--border)" : "none",
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: danger ? "#f87171" : "var(--foreground)" }}>{label}</div>
        <div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 2 }}>{desc}</div>
      </div>
      <button
        onClick={onClick}
        style={{
          padding: "6px 12px", borderRadius: "var(--radius-button)", fontSize: 12, fontWeight: 600,
          cursor: onClick ? "pointer" : "default", flexShrink: 0,
          border: danger ? "1px solid rgba(248,113,113,0.4)"
            : highlight ? "1px solid var(--brand)"
            : "1px solid var(--border)",
          background: danger ? "rgba(248,113,113,0.1)"
            : highlight ? "var(--brand-soft)"
            : "var(--surface-2)",
          color: danger ? "#f87171"
            : highlight ? "var(--foreground)"
            : pro || warning ? "var(--foreground)"
            : "var(--text-muted)",
        }}
      >{action}</button>
    </div>
  );
}

// ─── Project status badge ─────────────────────────────────────────────────────

function ProjectStatusBadge({ status }: { status: string }) {
  // Monochrom: AKTIV = brand-soft (active state), sonst neutral.
  // Vorher knallten grün/amber/grau gegen ein Profil-Karten-Lila — pure Slop.
  const isActive = status === "active";
  const label = status === "paused" ? "PAUSIERT" : status === "closed" ? "GESCHLOSSEN" : "AKTIV";
  return (
    <span style={{
      fontSize: 10, padding: "2px 7px", borderRadius: "var(--radius-tag)", fontWeight: 600,
      background: isActive ? "var(--brand-soft)" : "var(--surface-2)",
      color: isActive ? "var(--foreground)" : "var(--text-dim)",
      letterSpacing: 0.4,
    }}>{label}</span>
  );
}

// ─── Style helpers ────────────────────────────────────────────────────────────

const sLabel: React.CSSProperties = {
  margin: "0 0 10px", fontSize: 11,
  color: "var(--text-dim)", textTransform: "uppercase",
  letterSpacing: 1.2, fontWeight: 600,
};

const card: React.CSSProperties = {
  background: "var(--surface-1)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius-card)", padding: "13px 14px",
};

const dashedAddBtn: React.CSSProperties = {
  width: "100%", padding: "12px 0", borderRadius: "var(--radius-card)",
  background: "transparent", border: "1px dashed var(--border-strong)",
  color: "var(--text-dim)", fontSize: 13, cursor: "pointer", textAlign: "center",
};
