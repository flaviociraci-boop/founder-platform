import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  /* config options here */
};

export default withSentryConfig(nextConfig, {
  // Sentry-Org + -Project (für Source-Maps-Upload)
  org: "flavio-ciraci",
  project: "connectyfind",

  // Source-Maps werden in Production hochgeladen — braucht SENTRY_AUTH_TOKEN
  // als Vercel-Env. Lokaler Dev-Build skippt den Upload automatisch wenn
  // der Token fehlt.
  silent: !process.env.CI,

  // Tunnel-Route umgeht Ad-Blocker, indem Sentry-Requests über die eigene
  // Domain laufen statt direkt auf ingest.sentry.io. Verhindert dass
  // uBlock & Co. Error-Reports schlucken.
  tunnelRoute: "/monitoring",

  // Source-Maps für besseres Stack-Trace-Reporting
  widenClientFileUpload: true,
});
