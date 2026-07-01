// Zentraler Marker, den die native iOS-Hülle (Capacitor) via
// appendUserAgent an ihre WKWebView-Requests hängt. Server-Seite prüft
// den UA in proxy.ts / Server-Components; Client-Seite via useIsInApp()
// aus ./app-context.client.
//
// Diese Datei ist bewusst hooks-frei und ohne "use client", damit sie
// aus der Edge-Runtime (proxy.ts) sauber importierbar ist.
export const APP_UA_MARKER = "ConnectyfindApp";

export function isAppUserAgent(userAgent: string | null | undefined): boolean {
  if (!userAgent) return false;
  return userAgent.includes(APP_UA_MARKER);
}
