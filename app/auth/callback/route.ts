import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CATEGORY_COLORS: Record<string, string> = {
  ecommerce: "#f97316",
  apps: "#6366f1",
  trading: "#10b981",
  freelancer: "#f59e0b",
  marketing: "#ec4899",
  saas: "#3b82f6",
  coaching: "#8b5cf6",
};

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // For OAuth users: auto-create a profile if none exists yet
      const { data: existing } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_id", data.user.id)
        .maybeSingle();

      if (!existing) {
        const meta = data.user.user_metadata ?? {};

        const name =
          meta.name ??
          meta.full_name ??
          data.user.email?.split("@")[0] ??
          "Nutzer";

        const initials =
          meta.avatar ??
          name
            .split(" ")
            .map((n: string) => n[0] ?? "")
            .join("")
            .toUpperCase()
            .slice(0, 2);

        await supabase.from("profiles").insert({
          auth_id: data.user.id,
          name,
          age: meta.age ?? null,
          category: meta.category ?? null,
          seeking: meta.seeking ?? null,
          avatar: initials,
          color: meta.color ?? CATEGORY_COLORS.apps,
          followers: 0,
          following: 0,
          tags: [],
        });
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
