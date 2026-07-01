import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isAppUserAgent } from "@/app/lib/app-context";

const AUTH_PATHS = ["/login", "/register", "/auth", "/onboarding"];

// Routen, die für anonyme Besucher erreichbar sind (kein /login-Redirect).
// Seit Juni 2026 ist Connectyfind kostenlos — kein Paywall-Check mehr,
// nur noch reines Auth-Routing.
const PUBLIC_PATHS = [
  "/",
  "/api/subscribe",
  "/willkommen",
  "/welcome-pro",
  "/monitoring",
  "/impressum",
  "/datenschutz",
  "/agb",
  "/kontakt",
  "/cookie-richtlinie",
];

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
  const isApp = isAppUserAgent(request.headers.get("user-agent"));

  // App-Kontext: anonyme User sollen die Marketing-Landing NICHT sehen.
  // Direkter Einstieg in den Register/Onboarding-Flow — Bestandsuser
  // finden den prominenten Login-Link oben auf dem Register-Screen.
  if (isApp && !user && pathname === "/") {
    return NextResponse.redirect(new URL("/register", request.url));
  }

  // Anonyme User auf geschützten Pfaden → /login.
  if (!user && !isAuthPath && !isPublicPath) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Eingeloggte User auf /login oder /register → /.
  if (user && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
