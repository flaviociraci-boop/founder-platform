// Next.js Instrumentation-Hook — wird einmal pro Runtime initialisiert.
// Lädt die richtige Sentry-Config je nach Runtime (Node oder Edge).
// onRequestError leitet alle Request-Errors an Sentry weiter.

import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
