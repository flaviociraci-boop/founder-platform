// Server-side Sentry init für Node-Runtime (App Router Server Components,
// Route Handlers, Server Actions). Eingebunden via instrumentation.ts.

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || "production",

  tracesSampleRate: 0.1,

  debug: false,
});
