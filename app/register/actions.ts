"use server";

import { cookies } from "next/headers";
import { createClient as createServerSupabase } from "@/utils/supabase/server";
import { categories } from "@/app/lib/data";

const CATEGORY_COLORS: Record<string, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.color]),
);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type RegisterInput = {
  email: string;
  password: string;
  name: string;
  age: string;
  category: string;
  seeking: string;
};

export type RegisterResult = { error: string } | { ok: true };

/**
 * Register-Server-Action (kostenloser Zugang, nur Email-DOI als Gate):
 *  1. Validiert Input
 *  2. signUp() → Supabase verschickt Bestätigungsmail (Template zeigt
 *     auf /auth/callback mit token_hash). user_metadata enthält die
 *     Profil-Felder; ensureProfile() in /auth/callback baut nach Klick
 *     auf den Link die profiles-Row.
 *  3. Returns { ok: true } — UI zeigt "Bestätigungsmail verschickt".
 *     KEIN auto-signIn, weil die Email noch nicht bestätigt ist.
 */
export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const email = input.email.trim().toLowerCase();
  const password = input.password;
  const name = input.name.trim();

  if (!EMAIL_RE.test(email)) return { error: "Ungültige Email-Adresse." };
  if (password.length < 6) return { error: "Passwort muss mindestens 6 Zeichen lang sein." };
  if (!name) return { error: "Bitte Namen eingeben." };
  if (!input.category) return { error: "Bitte eine Kategorie wählen." };
  if (!input.seeking) return { error: "Bitte auswählen was du suchst." };

  const initials = name
    .split(" ")
    .map((n) => n[0] ?? "")
    .join("")
    .toUpperCase()
    .slice(0, 2);
  const age = input.age ? Number.parseInt(input.age, 10) : null;
  const color = CATEGORY_COLORS[input.category] ?? "#6366f1";

  const cookieStore = await cookies();
  const supabase = createServerSupabase(cookieStore);

  const { error: signUpErr } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        age,
        category: input.category,
        seeking: input.seeking,
        avatar: initials,
        color,
      },
    },
  });

  if (signUpErr) {
    console.error("[register] signUp failed:", signUpErr);
    if (signUpErr.message.toLowerCase().includes("already")) {
      return { error: "Diese Email-Adresse ist bereits registriert. Bitte einloggen." };
    }
    return { error: signUpErr.message };
  }

  return { ok: true };
}
