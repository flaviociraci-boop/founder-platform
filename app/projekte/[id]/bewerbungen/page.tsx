// Bewerbungs-Liste für ein eigenes Projekt. Server Component macht Auth +
// Owner-Check + Initial-Fetch; ApplicationsList (Client) übernimmt UI,
// Action-Buttons (Accept/Reject) und Realtime-Updates.
//
// Erreichbar via Notification-Deep-Link aus /mitteilungen:
// notification.type === "application_received" → diese Page.

import { cookies } from "next/headers";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import ApplicationsList, { type Application } from "./ApplicationsList";

type ApplicantProfile = {
  id: number;
  name: string;
  avatar: string | null;
  color: string;
  role: string | null;
};

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
    .select("id, title, user_id")
    .eq("id", projectId)
    .maybeSingle();
  if (!project) notFound();
  if (project.user_id !== profile.id) redirect(`/?tab=projects`);

  const { data: rawApps } = await supabase
    .from("applications")
    .select("id, user_id, project_id, message, status, created_at")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const applications: Application[] = (rawApps ?? []) as Application[];
  const applicantIds = Array.from(new Set(applications.map((a) => a.user_id)));

  const applicantsById: Record<number, ApplicantProfile> = {};
  if (applicantIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, name, avatar, color, role")
      .in("id", applicantIds);
    for (const p of profiles ?? []) {
      applicantsById[p.id as number] = {
        id: p.id as number,
        name: (p.name as string) ?? "Nutzer",
        avatar: (p.avatar as string | null) ?? null,
        color: (p.color as string) ?? "#6366f1",
        role: (p.role as string | null) ?? null,
      };
    }
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

      <div style={{ padding: "20px 20px 80px" }}>
        <ApplicationsList
          projectId={project.id}
          ownerProfileId={profile.id}
          applicants={applicantsById}
          initialApplications={applications}
        />
      </div>
    </div>
  );
}
