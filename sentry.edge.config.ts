// Edge-Runtime Sentry init für Middleware (proxy.ts) und edge-route-handlers.
// Eingebunden via instrumentation.ts wenn NEXT_RUNTIME === "edge".

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "production",

  tracesSampleRate: 0.1,

  debug: false,
});
