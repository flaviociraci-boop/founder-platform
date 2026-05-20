import { createBrowserClient } from "@supabase/ssr";

// Zentrale Konstanten — einmalig Env-Lookup mit Fallback zwischen den
// beiden gängigen Namen (legacy ANON_KEY und neuer PUBLISHABLE_KEY).
// Damit nutzen Browser-Client UND Direktfetch (z.B. Avatar-Upload in
// EditProfileForm) garantiert denselben gültigen Key, egal welcher
// Env-Var-Name in Vercel gesetzt ist.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_PUBLISHABLE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "";

export const createClient = () =>
  createBrowserClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
