// Bewerbungs-Liste für ein eigenes Projekt. Server Component, lädt
// Bewerbungen + Bewerber-Profile. Nur Owner darf rein (redirect sonst).
//
// Erreichbar via Notification-Deep-Link aus /mitteilungen:
// notification.type === "application_received" → diese Page.

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { Avatar } from "@/app/components/Avatar";

type Profile = {
  id: number;
  name: string;
  avatar: string | null;
  color: string;
  role: string | null;
};

type Application = {
  user_id: number;
  message: string | null;
  created_at: string;
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "gerade eben";
  if (m < 60) return `vor ${m} Min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `vor ${h} Std`;
  const d = Math.floor(h / 24);
  if (d === 1) return "gestern";
  return `vor ${d} Tagen`;
}

export default async function ProjectApplicationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idParam } = await params;
  const projectId = Number.parseInt(idParam, 10);
  if (!Number.isFinite(projectId)) notFound();

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_id", user.id)
    .maybeSingle();
  if (!profile) redirect("/");

  const { data: project } = await supabase
    .from("projects")
    .select("id, title, user_id, category")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();
  // Nur Owner darf die Bewerbungs-Liste sehen
  if (project.user_id !== profile.id) redirect(`/?tab=projects`);

  const { data: rawApps } = await supabase
    .from("applications")
    .select("user_id, message, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const applications: Application[] = (rawApps ?? []) as Application[];
  const applicantIds = applications.map((a) => a.user_id);

  let applicants: Map<number, Profile> = new Map();
  if (applicantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar, color, role")
      .in("id", applicantIds);
    applicants = new Map(
      (profiles ?? []).map((p) => [
        p.id as number,
        {
          id: p.id as number,
          name: (p.name as string) ?? "Nutzer",
          avatar: (p.avatar as string | null) ?? null,
          color: (p.color as string) ?? "#6366f1",
          role: (p.role as string | null) ?? null,
        },
      ]),
    );
  }

  return (
    <div style={{
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      background: "#0a0a0f",
      minHeight: "100vh",
      color: "#fff",
      maxWidth: 430,
      margin: "0 auto",
    }}>
      {/* Header */}
      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(10,10,15,0.95)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "16px 20px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <Link
          href="/?tab=projects"
          style={{
            background: "rgba(255,255,255,0.08)",
            padding: "8px 14px", borderRadius: 20,
            fontSize: 13, color: "#fff", textDecoration: "none",
          }}
        >
          ← Zurück
        </Link>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: 1, fontWeight: 700 }}>
            BEWERBUNGEN
          </div>
          <div style={{ fontWeight: 700, fontSize: 16, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {project.title}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "20px 20px 80px" }}>
        {applications.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.4)" }}>
            <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 16, color: "#fff" }}>
              Noch keine Bewerbungen
            </p>
            <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6 }}>
              Sobald sich jemand auf dein Projekt bewirbt, erscheint die Nachricht hier.
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {applications.map((app) => {
              const applicant = applicants.get(app.user_id);
              if (!applicant) return null;
              return (
                <div key={`${app.user_id}-${app.created_at}`} style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 16, padding: 16,
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: app.message ? 12 : 0 }}>
                    <Avatar
                      src={applicant.avatar ?? applicant.name.charAt(0)}
                      color={applicant.color}
                      size={44}
                      radius={13}
                    />
                    <div style={{ flex: 1, overflow: "hidden" }}>
                      <div style={{ fontWeight: 700, fontSize: 15 }}>{applicant.name}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                        {applicant.role ?? "Founder"} · {relativeTime(app.created_at)}
                      </div>
                    </div>
                  </div>
                  {app.message && (
                    <p style={{
                      margin: 0, fontSize: 14, lineHeight: 1.55,
                      color: "rgba(255,255,255,0.75)",
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      borderRadius: 12, padding: "12px 14px",
                      whiteSpace: "pre-wrap", wordBreak: "break-word",
                    }}>
                      {app.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
