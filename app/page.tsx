import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import AppShell from "@/app/components/AppShell";
import { User, Project, timeAgo } from "@/app/lib/data";

export default async function Page() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profiles, error: profilesError }, { data: rawProjects }, { data: currentProfile }] =
    await Promise.all([
      supabase.from("profiles").select("*, companies(*)").order("id"),
      supabase
        .from("projects")
        .select("*")
        .order("created_at", { ascending: false }),
      user
        ? supabase.from("profiles").select("id, name, avatar, color").eq("auth_id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  if (profilesError) {
    console.error("Supabase error:", profilesError.message);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const users: User[] = (profiles ?? []).map((p: any) => ({
    id: p.id,
    name: p.name,
    age: p.age,
    category: p.category,
    role: p.role,
    location: p.location,
    followers: p.followers,
    following: p.following,
    tags: p.tags ?? [],
    bio: p.bio,
    seeking: p.seeking,
    avatar: p.avatar,
    color: p.color,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    companies: (p.companies ?? []).map((c: any) => ({
      name: c.name,
      role: c.role,
      year: c.year,
      type: c.type,
      active: c.active,
    })),
  }));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const projects: Project[] = (rawProjects ?? []).map((p: any) => ({
    id: p.id,
    userId: p.user_id,
    title: p.title,
    desc: p.description,
    category: p.category,
    location: p.location,
    model: p.model,
    tags: p.tags ?? [],
    applicants: p.applicants,
    color: p.color,
    avatar: p.avatar,
    userName: p.user_name,
    timeAgo: timeAgo(p.created_at),
  }));

  return (
    <AppShell
      initialUsers={users}
      initialProjects={projects}
      currentUserId={currentProfile?.id ?? null}
      currentUserName={currentProfile?.name ?? null}
      currentUserAvatar={currentProfile?.avatar ?? null}
      currentUserColor={currentProfile?.color ?? null}
    />
  );
}
