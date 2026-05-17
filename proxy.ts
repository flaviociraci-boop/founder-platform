import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const AUTH_PATHS = ["/login", "/register", "/auth"];

// Routen, die für anonyme Besucher erreichbar sind (kein /login-Redirect).
const PUBLIC_PATHS = [
  "/",
  "/api/subscribe",
  "/willkommen",
  "/pricing",
  "/welcome-pro",
  "/api/whop/webhook",
  "/api/whop/check-subscription",
  "/monitoring",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/kontakt",
  "/cookie-richtlinie",
];

// Routen, bei denen für eingeloggte User der Subscription-Check entfällt.
// = PUBLIC_PATHS ohne "/", weil "/" für eingeloggte User die AppShell
// rendert — die soll nur mit aktiver Sub sichtbar sein.
const PAYWALL_BYPASS_PATHS = PUBLIC_PATHS.filter((p) => p !== "/");
const PAYWALL_BYPASS_PREFIXES = ["/auth/", "/api/whop/", "/api/auth/"];

// Subscription-Status, die App-Zugang geben. Whop's eigener Wert ist
// "trialing", unser Webhook-Handler mappt das aktuell aber auf "trial"
// (siehe handleMembershipActivated). Wir akzeptieren beide, damit
// Phase 4 unabhängig vom Status-Mapping funktioniert.
const PAYWALL_PASS_STATUSES = ["active", "trial", "trialing"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();
  const { pathname } = request.nextUrl;
  const isAuthPath = AUTH_PATHS.some((p) => pathname.startsWith(p));
  const isPublicPath = PUBLIC_PATHS.includes(pathname);
  const isPaywallBypass =
    isAuthPath ||
    PAYWALL_BYPASS_PATHS.includes(pathname) ||
    PAYWALL_BYPASS_PREFIXES.some((p) => pathname.startsWith(p));

  // Redirect unauthenticated users to login (but not from landing page or auth pages)
  if (!user && !isAuthPath && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect logged-in users away from login/register
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Paywall: eingeloggte User ohne aktive/trialing Subscription → /pricing.
  // RLS auf subscriptions erlaubt den SELECT auf die eigene Row (auth.uid()
  // = user_id). Bei DB-Fehler durchlassen — lieber kurz Gratis-Zugang als
  // kaputte App. Vercel-Log-Filter: "[paywall]".
  if (user && !isPaywallBypass) {
    const { data, error } = await supabase
      .from("subscriptions")
      .select("id")
      .eq("user_id", user.id)
      .in("status", PAYWALL_PASS_STATUSES)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[paywall] subscription check failed:", error);
    } else if (!data) {
      return NextResponse.redirect(new URL("/pricing", request.url), 307);
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
