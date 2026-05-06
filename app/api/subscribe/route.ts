import { NextRequest, NextResponse } from "next/server";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: NextRequest) {
  const { email } = await req.json().catch(() => ({ email: "" }));

  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Ungültige E-Mail-Adresse." }, { status: 400 });
  }

  const apiKey = process.env.BREVO_API_KEY;
  const listId = process.env.BREVO_LIST_ID;
  const templateId = process.env.BREVO_DOI_TEMPLATE_ID;

  if (!apiKey || !listId || !templateId) {
    return NextResponse.json({ error: "Server-Konfigurationsfehler." }, { status: 500 });
  }

  const res = await fetch("https://api.brevo.com/v3/contacts/doubleOptinConfirmation", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify({
      email,
      includeListIds: [parseInt(listId, 10)],
      templateId: parseInt(templateId, 10),
      redirectionUrl: "https://founder-platform-five.vercel.app/willkommen",
    }),
  });

  // DOI endpoint returns 204 on success (no body)
  if (res.status === 204) {
    return NextResponse.json({ success: true }, { status: 200 });
  }

  const body = await res.json().catch(() => ({}));
  return NextResponse.json(
    { error: body?.message ?? "Unbekannter Fehler." },
    { status: res.status }
  );
}
