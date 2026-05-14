import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

// ---------------------------------------------------------------------------
// Types — defensiv: Whop kann Felder zwischen API-Versionen verschieben,
// deshalb sind alle Payload-Felder optional und werden mit ?. ausgelesen.
// ---------------------------------------------------------------------------

type WhopEventBase<TData = Record<string, unknown>> = {
  // Whop ist je nach API-Version inkonsistent bei der Benennung des Action-
  // Felds. Wir lesen alle drei Varianten aus, der erste Treffer gewinnt.
  action?: string;
  type?: string;
  event?: string;
  api_version?: string;
  data?: TData;
};

type WhopUser = {
  id?: string;
  email?: string;
  name?: string;
  username?: string;
};

type WhopMembership = {
  id?: string;
  user_id?: string;
  user?: WhopUser;
  member?: { id?: string };
  plan_id?: string;
  product_id?: string;
  // Whop liefert Strings wie "trialing" | "active" | "past_due" | "completed" | …
  status?: string;
  valid?: boolean;
  trial_end?: number | string | null;
  renewal_period_start?: number | string | null;
  renewal_period_end?: number | string | null;
  expires_at?: number | string | null;
  cancel_at_period_end?: boolean;
  canceled_at?: number | string | null;
  created_at?: number | string | null;
  // Whop hängt im Checkout-Redirect ?payment_id=… an; je nach Payload sitzt
  // die ID an unterschiedlichen Stellen. Defensiv alle drei abdecken.
  payment_id?: string;
  last_payment?: { id?: string };
  receipt?: { id?: string };
  receipt_id?: string;
};

type WhopPayment = {
  id?: string;
  membership_id?: string;
  membership?: WhopMembership;
  user_id?: string;
  user?: WhopUser;
  plan_id?: string;
  status?: string;
  paid_at?: number | string | null;
  created_at?: number | string | null;
  expiration_date?: number | string | null;
};

type SubscriptionStatus =
  | "pending"
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

// ---------------------------------------------------------------------------
// Konstanten
// ---------------------------------------------------------------------------

const LOG = "WHOP_WEBHOOK:";
const SIGNATURE_TOLERANCE_SECONDS = 300;
const MAX_BODY_SIZE_BYTES = 1024 * 1024; // 1 MB

// ---------------------------------------------------------------------------
// Standard-Webhooks-Signaturprüfung
// Spec: https://www.standardwebhooks.com/  ·  Whop-Doku: docs.whop.com/developer/guides/webhooks
//
// Whop sendet drei Headers (webhook-id, webhook-timestamp, webhook-signature).
// Signed content = `${id}.${timestamp}.${rawBody}`. Signatur-Header kann
// mehrere v1,sig (space-separiert) enthalten, ein Match reicht.
// ---------------------------------------------------------------------------

// Whop liefert ws_<hash>-Secrets. Das Format des hash-Teils ist nicht
// offiziell dokumentiert; wir probieren mehrere Decode-Varianten und
// akzeptieren die erste, die matcht. Match-Label wird geloggt für
// Audit/Debug-Zwecke. Sobald sicher feststeht, welche Variante Whop nutzt,
// können die anderen entfernt werden.
function getSecretKeyCandidates(
  secret: string,
): Array<{ label: string; key: Buffer }> {
  const candidates: Array<{ label: string; key: Buffer }> = [];
  const withoutPrefix = secret.startsWith("ws_") ? secret.slice(3) : secret;

  // Variante A: ohne Prefix, hex-decoded (wahrscheinlichste bei 64-char Hex → 32 Byte Key)
  if (/^[0-9a-fA-F]+$/.test(withoutPrefix) && withoutPrefix.length % 2 === 0) {
    try {
      const key = Buffer.from(withoutPrefix, "hex");
      if (key.length === 32) candidates.push({ label: "hex-stripped", key });
    } catch {
      // ignore
    }
  }

  // Variante B: ohne Prefix, als-ist (raw UTF8-string)
  candidates.push({ label: "raw-stripped", key: Buffer.from(withoutPrefix, "utf8") });

  // Variante C: ganzes Secret als-ist (inkl. ws_-Prefix)
  candidates.push({ label: "raw-full", key: Buffer.from(secret, "utf8") });

  // Variante D: ohne Prefix, base64-decoded (Standard-Webhooks-Default, Fallback)
  try {
    const key = Buffer.from(withoutPrefix, "base64");
    if (key.length > 0) candidates.push({ label: "base64-stripped", key });
  } catch {
    // ignore
  }

  return candidates;
}

type VerifyResult =
  | { ok: true; variant: string }
  | { ok: false; status: 401; reason: string };

function verifyStandardWebhook(
  rawBody: string,
  webhookId: string,
  webhookTimestamp: string,
  signatureHeader: string,
  secret: string,
): VerifyResult {
  const ts = Number(webhookTimestamp);
  if (!Number.isFinite(ts)) {
    return { ok: false, status: 401, reason: "Invalid timestamp" };
  }
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, status: 401, reason: "Timestamp out of tolerance" };
  }

  const candidates = getSecretKeyCandidates(secret);
  if (candidates.length === 0) {
    return { ok: false, status: 401, reason: "Invalid secret format" };
  }

  // Empfangene Signaturen vorab dekodieren — pro Kandidat-Key müssen wir
  // gegen alle vergleichen, also einmal parsen reicht.
  const receivedSigs: Buffer[] = [];
  for (const part of signatureHeader.split(" ")) {
    const [version, sig] = part.split(",");
    if (version !== "v1" || !sig) continue;
    try {
      receivedSigs.push(Buffer.from(sig, "base64"));
    } catch {
      // skip malformed
    }
  }
  if (receivedSigs.length === 0) {
    return { ok: false, status: 401, reason: "Invalid signature" };
  }

  const signedContent = `${webhookId}.${webhookTimestamp}.${rawBody}`;

  for (const { label, key } of candidates) {
    const expected = crypto
      .createHmac("sha256", key)
      .update(signedContent)
      .digest(); // raw Buffer für timingSafeEqual
    for (const sigBuf of receivedSigs) {
      if (sigBuf.length !== expected.length) continue;
      if (crypto.timingSafeEqual(sigBuf, expected)) {
        console.log(`${LOG} signature matched variant=${label}`);
        return { ok: true, variant: label };
      }
    }
  }

  const labels = candidates.map((c) => c.label).join(", ");
  console.warn(`${LOG} no variant matched. Tried: ${labels}`);
  return { ok: false, status: 401, reason: "Invalid signature" };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Normalisiert Event-Namen: lowercase + Bindestriche/Punkte → Underscores.
// Whop sendet im echten Payload Dot-Notation ("membership.activated"), die
// Docs-URLs nutzen Bindestriche ("membership-activated"), und ältere Quellen
// nennen Underscores ("membership_activated"). Wir tolerieren alle drei.
function normalizeEventName(action: string): string {
  return action.toLowerCase().replace(/[-.]/g, "_");
}

function getPlanType(planId: string | null | undefined): string {
  if (!planId) return "unknown";
  if (planId === process.env.WHOP_MONTHLY_PLAN_ID) return "monthly";
  if (planId === process.env.WHOP_YEARLY_PLAN_ID) return "yearly";
  console.warn(`${LOG} unknown plan_id ${planId}`);
  return "unknown";
}

// Akzeptiert unix seconds, unix milliseconds, ISO-Strings — Whop ist da
// nicht ganz konsistent, je nach Event sind Felder Numbers (sec) oder Strings.
function parseTimestamp(value: unknown): string | null {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) {
    const ms = value > 1e11 ? value : value * 1000;
    return new Date(ms).toISOString();
  }
  if (typeof value === "string") {
    const n = Number(value);
    if (Number.isFinite(n) && value.trim() !== "") {
      const ms = n > 1e11 ? n : n * 1000;
      return new Date(ms).toISOString();
    }
    const parsed = Date.parse(value);
    if (Number.isFinite(parsed)) return new Date(parsed).toISOString();
  }
  return null;
}

function extractMembershipId(data: WhopMembership & WhopPayment): string | null {
  return data?.membership_id ?? data?.membership?.id ?? data?.id ?? null;
}

function extractPlanId(data: WhopMembership & WhopPayment): string | null {
  return data?.plan_id ?? data?.membership?.plan_id ?? null;
}

function extractWhopUserId(data: WhopMembership & WhopPayment): string | null {
  // Echte Whop-Payloads schicken den User verschachtelt unter data.user;
  // ältere/flache Strukturen werden zusätzlich als Fallback geprüft.
  return (
    data?.user?.id ??
    data?.user_id ??
    data?.member?.id ??
    data?.membership?.user?.id ??
    data?.membership?.user_id ??
    null
  );
}

function extractWhopUserEmail(data: WhopMembership & WhopPayment): string | null {
  // Lowercase, damit der Match in /api/whop/check-subscription und
  // /auth/callback case-insensitiv funktioniert (Whop preserved Email-Case,
  // User tippt sie evtl. anders).
  const email = data?.user?.email ?? data?.membership?.user?.email ?? null;
  return email ? email.toLowerCase() : null;
}

// Payment-ID-Extraktion für /register-Email-Prefill via subscriptions.
// payment_succeeded ruft separat data.id, weil dort data SELBST das Payment
// ist; für Membership-Events probieren wir verschiedene Stellen, weil Whop
// das Feld je nach Payload mal flach, mal unter last_payment / receipt
// liefert.
function extractMembershipPaymentId(data: WhopMembership & WhopPayment): string | null {
  return (
    data?.payment_id ??
    data?.last_payment?.id ??
    data?.receipt?.id ??
    data?.receipt_id ??
    null
  );
}

// ---------------------------------------------------------------------------
// Event-Handler
// Jeder Handler wirft bei DB-Fehlern (→ 500 → Whop retried), gibt aber bei
// fehlenden Payload-Feldern nur eine Warning aus (→ 200, kein Retry).
// ---------------------------------------------------------------------------

type Supabase = ReturnType<typeof createServiceRoleClient>;

async function handlePaymentSucceeded(supabase: Supabase, data: WhopPayment & WhopMembership) {
  const membershipId = extractMembershipId(data);
  if (!membershipId) {
    console.warn(`${LOG} payment_succeeded missing membership id`);
    return;
  }
  const planId = extractPlanId(data);
  const periodStart = parseTimestamp(
    data?.membership?.renewal_period_start ?? data?.paid_at ?? data?.created_at,
  );
  const periodEnd = parseTimestamp(
    data?.membership?.renewal_period_end ?? data?.expiration_date,
  );
  // payment_succeeded: data IST das Payment-Objekt, also data.id = payment_id.
  const paymentId = data?.id ?? null;
  const nowIso = new Date().toISOString();

  const { error } = await supabase.from("subscriptions").upsert(
    {
      whop_membership_id: membershipId,
      whop_user_id: extractWhopUserId(data),
      whop_user_email: extractWhopUserEmail(data),
      whop_plan_id: planId,
      plan_type: getPlanType(planId),
      status: "active" satisfies SubscriptionStatus,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      // Nur setzen wenn vorhanden — andernfalls würde ein späteres Event
      // ohne payment_id einen bestehenden Wert mit NULL überschreiben.
      ...(paymentId ? { whop_payment_id: paymentId } : {}),
      updated_at: nowIso,
    },
    { onConflict: "whop_membership_id" },
  );
  if (error) {
    throw new Error(`payment_succeeded upsert failed: ${error.message}`);
  }
}

async function handlePaymentFailed(supabase: Supabase, data: WhopPayment & WhopMembership) {
  const membershipId = extractMembershipId(data);
  if (!membershipId) {
    console.warn(`${LOG} payment_failed missing membership id`);
    return;
  }
  const { data: existing, error: lookupErr } = await supabase
    .from("subscriptions")
    .select("id")
    .eq("whop_membership_id", membershipId)
    .maybeSingle();
  if (lookupErr) {
    throw new Error(`payment_failed lookup failed: ${lookupErr.message}`);
  }
  if (!existing) {
    console.warn(`${LOG} payment_failed for unknown membership ${membershipId}`);
    return;
  }
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "past_due" satisfies SubscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("whop_membership_id", membershipId);
  if (error) {
    throw new Error(`payment_failed update failed: ${error.message}`);
  }
}

// payment_created ist rein informativ: zu diesem Zeitpunkt weiß Whop schon,
// dass eine Zahlung initiiert wurde, aber noch nicht ob sie durchgeht.
// Wir warten bewusst auf payment_succeeded oder membership_activated bevor
// wir eine subscription anlegen — andernfalls bekämen wir "stale" pending-
// Rows von Karten, die später abgelehnt werden.
async function handlePaymentCreated(_supabase: Supabase, data: WhopPayment) {
  console.log(`${LOG} payment_created (informational, no DB write) id=${data?.id ?? "<no-id>"}`);
}

async function handleMembershipActivated(supabase: Supabase, data: WhopMembership) {
  const membershipId = data?.id;
  if (!membershipId) {
    console.warn(`${LOG} membership_activated missing id`);
    return;
  }
  const planId = extractPlanId(data) ?? null;
  const trialEnd = parseTimestamp(data?.trial_end);
  const periodStart = parseTimestamp(data?.renewal_period_start ?? data?.created_at);
  const periodEnd = parseTimestamp(data?.renewal_period_end ?? data?.expires_at);
  // Whop signalisiert Trial entweder per status="trialing" oder per trial_end.
  const isTrial = trialEnd != null || data?.status === "trialing";
  const status: SubscriptionStatus = isTrial ? "trial" : "active";
  const nowIso = new Date().toISOString();

  // Helpful während Etappe 2 noch nicht steht — wir wissen damit, welcher
  // User später beim Register-Flow verknüpft werden muss.
  console.log(
    `${LOG} membership user_email=${data?.user?.email ?? "<no-email>"} ` +
      `user_id=${data?.user?.id ?? "<no-id>"} status=${status}`,
  );

  const paymentId = extractMembershipPaymentId(data);

  const { error } = await supabase.from("subscriptions").upsert(
    {
      whop_membership_id: membershipId,
      whop_user_id: extractWhopUserId(data),
      whop_user_email: extractWhopUserEmail(data),
      whop_plan_id: planId,
      plan_type: getPlanType(planId),
      status,
      trial_ends_at: trialEnd,
      current_period_start: periodStart,
      current_period_end: periodEnd,
      // user_id wird in Etappe 2 (Register-Flow) via whop_user_email verknüpft.
      // Nur setzen wenn vorhanden — Race mit payment_succeeded sonst.
      ...(paymentId ? { whop_payment_id: paymentId } : {}),
      updated_at: nowIso,
    },
    { onConflict: "whop_membership_id" },
  );
  if (error) {
    throw new Error(`membership_activated upsert failed: ${error.message}`);
  }
}

async function handleMembershipDeactivated(supabase: Supabase, data: WhopMembership) {
  const membershipId = data?.id;
  if (!membershipId) {
    console.warn(`${LOG} membership_deactivated missing id`);
    return;
  }
  const { error } = await supabase
    .from("subscriptions")
    .update({
      status: "expired" satisfies SubscriptionStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("whop_membership_id", membershipId);
  if (error) {
    throw new Error(`membership_deactivated update failed: ${error.message}`);
  }
}

async function handleCancelAtPeriodEndChanged(supabase: Supabase, data: WhopMembership) {
  const membershipId = data?.id;
  if (!membershipId) {
    console.warn(`${LOG} cancel_at_period_end_changed missing id`);
    return;
  }
  const cancelRequested = data?.cancel_at_period_end === true;
  const { error } = await supabase
    .from("subscriptions")
    .update({
      canceled_at: cancelRequested ? new Date().toISOString() : null,
      // Status bleibt 'active'/'trial' bis zum tatsächlichen Period-End.
      updated_at: new Date().toISOString(),
    })
    .eq("whop_membership_id", membershipId);
  if (error) {
    throw new Error(`cancel_at_period_end_changed update failed: ${error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const secret = process.env.WHOP_WEBHOOK_SECRET;
  if (!secret) {
    console.error(`${LOG} WHOP_WEBHOOK_SECRET not configured`);
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  // Raw body VOR JSON-Parse — wir signieren über exakt diese Bytes.
  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch (err) {
    console.error(`${LOG} failed to read body`, err);
    return NextResponse.json({ error: "Cannot read body" }, { status: 400 });
  }

  const webhookId = request.headers.get("webhook-id");
  const webhookTimestamp = request.headers.get("webhook-timestamp");
  const webhookSignature = request.headers.get("webhook-signature");

  if (!webhookId || !webhookTimestamp || !webhookSignature) {
    console.warn(`${LOG} missing signature headers`);
    return NextResponse.json(
      { error: "Missing signature headers" },
      { status: 401 },
    );
  }

  const verify = verifyStandardWebhook(
    rawBody,
    webhookId,
    webhookTimestamp,
    webhookSignature,
    secret,
  );
  if (!verify.ok) {
    console.warn(`${LOG} signature verification failed: ${verify.reason}`);
    return NextResponse.json({ error: verify.reason }, { status: verify.status });
  }

  // Body-Size-Limit NACH Signaturprüfung — Schutz gegen Mist von authentifizierten
  // Quellen. Whop-Payloads sind in der Regel < 5 KB.
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_SIZE_BYTES) {
    console.warn(`${LOG} body exceeds ${MAX_BODY_SIZE_BYTES} bytes`);
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!parsed || typeof parsed !== "object") {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const event = parsed as WhopEventBase;

  // Debug: Whop-Payload-Struktur loggen, bis wir die tatsächlichen Feldnamen
  // einer API-Version kennen. Preview auf 500 Zeichen begrenzt.
  console.log(`${LOG} payload keys:`, Object.keys(event));
  console.log(`${LOG} payload preview:`, JSON.stringify(event).substring(0, 500));

  const rawAction = event?.action ?? event?.type ?? event?.event ?? "";
  if (!rawAction) {
    console.warn(`${LOG} no action field found. Keys: ${Object.keys(event).join(", ")}`);
  }
  const action = normalizeEventName(rawAction);
  const data = (event?.data ?? {}) as WhopMembership & WhopPayment;
  console.log(`${LOG} received ${rawAction} id=${data?.id ?? "<no-id>"}`);

  const supabase = createServiceRoleClient();

  try {
    switch (action) {
      case "payment_succeeded":
        await handlePaymentSucceeded(supabase, data);
        break;
      case "payment_failed":
        await handlePaymentFailed(supabase, data);
        break;
      case "payment_created":
        await handlePaymentCreated(supabase, data);
        break;
      // Whop hat den Aktivierungs-Event je nach API-Version unterschiedlich
      // benannt — beide Spellings akzeptieren, schadet nicht.
      case "membership_activated":
      case "membership_went_valid":
        await handleMembershipActivated(supabase, data);
        break;
      case "membership_deactivated":
      case "membership_went_invalid":
        await handleMembershipDeactivated(supabase, data);
        break;
      // Spec nennt es ohne '-d', die Whop-Docs/V5 mit '-d' — beide handhaben.
      case "membership_cancel_at_period_end_changed":
      case "membership_cancel_at_period_end_change":
        await handleCancelAtPeriodEndChanged(supabase, data);
        break;
      default:
        console.warn(`${LOG} unhandled event: ${rawAction}`);
        // Bewusst 200 — Retry wäre sinnlos.
        break;
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`${LOG} handler error for ${rawAction}:`, message, err);
    // Kein Stack-Trace im Response.
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }

  return NextResponse.json({ received: true }, { status: 200 });
}
