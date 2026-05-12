-- Email aus dem Whop-Webhook für späteres Account-Verknüpfen beim Register-Flow
-- (Etappe 2B). Existierende Rows haben NULL, daher kein NOT NULL constraint.

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS whop_user_email TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_whop_user_email
  ON public.subscriptions(whop_user_email);
