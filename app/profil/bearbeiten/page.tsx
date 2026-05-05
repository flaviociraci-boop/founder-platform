import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import EditProfileForm from "./EditProfileForm";

export default async function EditProfilePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, username, age, location, bio, seeking, category, tags, avatar, color")
    .eq("auth_id", user.id)
    .maybeSingle();

  if (!profile) redirect("/");

  return <EditProfileForm profile={profile} />;
}
