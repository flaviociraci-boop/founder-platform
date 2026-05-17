"use client";

// App-Router-Catch-All-Error-Boundary. Wird gerendert wenn ein Root-Layout-
// Error auftritt. Schickt den Error an Sentry und zeigt Next.js' Default-
// Error-Page.

import * as Sentry from "@sentry/nextjs";
import NextError from "next/error";
import { useEffect } from "react";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body>
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
