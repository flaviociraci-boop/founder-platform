// Browser-side Sentry init. Wird automatisch beim Page-Load eingebunden.
//
// CSP-Konflikt-Workaround (17.05.2026):
// Unsere CSP (vermutlich von Vercel project settings) erlaubt kein 'unsafe-eval'
// im script-src. Sentry's BrowserTracing-Integration nutzt aber intern eval.
// Folge: Frontend-Errors wurden nicht an Sentry geschickt.
//
// Workaround: BrowserTracing-Integration explizit aus den Defaults filtern +
// tracesSampleRate auf 0. Error-Tracking funktioniert weiterhin, nur
// Performance-Tracing verloren. Replays sind sowieso aus (Free-Tier).
//
// Permanenter Fix (Option für später): 'unsafe-eval' zur CSP im Vercel-
// Dashboard hinzufügen, dann diesen Workaround zurücknehmen.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "production",

  integrations: (defaultIntegrations) =>
    defaultIntegrations.filter((i) => i.name !== "BrowserTracing"),

  tracesSampleRate: 0,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  debug: false,
});
