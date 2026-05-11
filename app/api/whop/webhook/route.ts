import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceRoleClient } from "@/utils/supabase/service-role";

const WHOP_WEBHOOK_SECRET = process.env.WHOP_WEBHOOK_SECRET ?? "";
const MONTHLY_PLAN_ID = process.env.WHOP_MONTHLY_PLAN_ID ?? "plan_guzJNAzucfCXz";
const YEARLY_PLAN_ID = process.env.WHOP_YEARLY_PLAN_ID ?? "plan_x7IVn5qGLXsfM";

function verifySignature(body: string, signature: string | null): boolean {
  if (!signature || !WHOP_WEBHOOK_SECRET) return false;
  const digest = crypto
    .createHmac("sha256", WHOP_WEBHOOK_SECRET)
    .update(body)
    .digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}

function resolvePlanType(planId: string | undefined): string {
  if (planId === MONTHLY_PLAN_ID) return "monthly";
  if (planId === YEARLY_PLAN_ID) return "yearly";
  return "unknown";
}

async function findUserIdByEmail(supabase: ReturnType<typeof createServiceRoleClient>, email: string): Promise<string | null> {
  const { data, error } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  if (error) { console.error("listUsers error:", error); return null; }
  const found = data?.users?.find((u) => u.email === email);
  return found?.id ?? null;
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-whop-signature");

  if (!verifySignature(body, signature)) {
    console.error("Whop webhook: invalid signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: { action: string; data: Record<string, any> };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { action, data } = event;
  console.log(`Whop webhook received: ${action}`, data?.id ?? "");

  const supabase = createServiceRoleClient();

  switch (action) {
    case "payment_succeeded": {
      const email = data?.user?.email ?? data?.email;
      const membershipId = data?.membership_id ?? data?.id;

      if (!email || !membershipId) {
        console.warn("payment_succeeded: missing email or membershipId", { email, membershipId });
        break;
      }

      const userId = await findUserIdByEmail(supabase, email);
      if (!userId) {
        console.warn("payment_succeeded: no user found for email", email);
        break;
      }

      const { error } = await supabase.from("subscriptions").upsert({
        user_id: userId,
        whop_user_id: data?.user?.id ?? null,
        whop_membership_id: membershipId,
        whop_plan_id: data?.plan_id ?? null,
        status: "active",
        plan_type: resolvePlanType(data?.plan_id),
        current_period_start: data?.created_at
          ? new Date(data.created_at * 1000).toISOString()
          : null,
        current_period_end: data?.expiration_date
          ? new Date(data.expiration_date * 1000).toISOString()
          : null,
      }, { onConflict: "whop_membership_id" });

      if (error) console.error("payment_succeeded upsert error:", error);
      else console.log("payment_succeeded: subscription upserted for user", userId);
      break;
    }

    case "membership_activated": {
      const membershipId = data?.id;
      if (!membershipId) { console.warn("membership_activated: missing id"); break; }

      const trialEnd = data?.trial_end
        ? new Date(data.trial_end * 1000).toISOString()
        : null;

      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "active", trial_ends_at: trialEnd })
        .eq("whop_membership_id", membershipId);

      if (error) console.error("membership_activated update error:", error);
      else console.log("membership_activated:", membershipId);
      break;
    }

    case "membership_deactivated": {
      const membershipId = data?.id;
      if (!membershipId) { console.warn("membership_deactivated: missing id"); break; }

      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "inactive" })
        .eq("whop_membership_id", membershipId);

      if (error) console.error("membership_deactivated update error:", error);
      else console.log("membership_deactivated:", membershipId);
      break;
    }

    case "refund_created": {
      const membershipId = data?.membership_id ?? data?.id;
      if (!membershipId) { console.warn("refund_created: missing membershipId"); break; }

      const { error } = await supabase
        .from("subscriptions")
        .update({ status: "canceled", canceled_at: new Date().toISOString() })
        .eq("whop_membership_id", membershipId);

      if (error) console.error("refund_created update error:", error);
      else console.log("refund_created: subscription canceled for membership", membershipId);
      break;
    }

    case "membership_cancel_at_period_end_changed": {
      const membershipId = data?.id;
      console.log(
        "membership_cancel_at_period_end_changed:",
        membershipId,
        "cancel_at_period_end:", data?.cancel_at_period_end
      );
      break;
    }

    case "payment_failed":
      console.log("payment_failed:", data?.id ?? "");
      break;

    case "payment_pending":
      console.log("payment_pending:", data?.id ?? "");
      break;

    default:
      console.log("Unhandled Whop event:", action);
  }

  return NextResponse.json({ received: true });
}
