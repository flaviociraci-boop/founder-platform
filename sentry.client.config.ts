// Browser-side Sentry init. Wird automatisch beim Page-Load eingebunden.
//
// Sample-Rates niedrig wegen Sentry Free Tier (5.000 Events/Monat):
// - tracesSampleRate 0.1   → 10% Performance-Tracing
// - replaysSession 0       → kein Session-Replay (würde Quota sprengen)
// - replaysOnError 0       → auch bei Errors nicht
// Bei wachsender Userzahl ggf. hochskalieren oder auf bezahltes Tier.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV || "production",

  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 0,

  // Wenn ein Bug-Report Stack-Frames im Browser zeigen soll
  // (während Dev/Preview), gerne `debug: true` setzen.
  debug: false,
});
