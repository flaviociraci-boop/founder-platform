"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";

// Zentraler Hook für "User hat aktives Pro-Abo".
// Status-Set entspricht der Middleware-Paywall (proxy.ts):
// active/trial/trialing → Pro. Damit kann ein User, der durch die
// Paywall kommt, auch nirgends mehr einen "Pro werden"-CTA sehen.
//
// Kein current_period_end-Filter: trial-Käufe ohne Billing-Period
// (Whop liefert dann NULL) würden sonst fälschlich als nicht-Pro
// gewertet — Webhook setzt status='expired'/'canceled' wenn die
// Subscription tatsächlich ausläuft.
const PRO_STATUSES = ["active", "trial", "trialing"];

export function useIsPro(): { isPro: boolean; loading: boolean } {
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        if (!cancelled) {
          setIsPro(false);
          setLoading(false);
        }
        return;
      }
      const { data } = await supabase
        .from("subscriptions")
        .select("id")
        .eq("user_id", user.id)
        .in("status", PRO_STATUSES)
        .limit(1)
        .maybeSingle();
      if (!cancelled) {
        setIsPro(!!data);
        setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { isPro, loading };
}
