// Server-side companion zum Sentry-Test. GET wirft einen Error,
// der vom Sentry-Server-SDK abgefangen wird.

export const dynamic = "force-dynamic";

export function GET() {
  throw new Error("Sentry server-side test — " + new Date().toISOString());
}
