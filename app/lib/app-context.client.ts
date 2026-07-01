"use client";

import { useEffect, useState } from "react";

/**
 * Client-Hook. Prüft window.Capacitor (wird vom nativen Runtime
 * injiziert und ist ab dem ersten Client-Render gesetzt). Rendert
 * initial `false` und flippt beim useEffect auf `true`, wenn Capacitor
 * da ist — vermeidet Hydration-Mismatches.
 *
 * Server-seitige App-Erkennung läuft über den UA-Marker in
 * ./app-context.ts (isAppUserAgent) — nutze das im proxy.ts und in
 * Server-Components mit `headers()`.
 */
export function useIsInApp(): boolean {
  const [isApp, setIsApp] = useState(false);
  useEffect(() => {
    const w = window as { Capacitor?: unknown };
    setIsApp(Boolean(w.Capacitor));
  }, []);
  return isApp;
}
