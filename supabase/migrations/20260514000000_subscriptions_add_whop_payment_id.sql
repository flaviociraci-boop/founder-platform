-- Whop-Payment-ID aus dem Checkout-Redirect persistieren.
-- Wird benutzt, um beim /register-Aufruf die Email vorab aus der Sub-Row
-- zu lesen (UX: Email-Feld prefilled + disabled).
--
-- Bestehende Rows haben NULL, kein NOT NULL constraint.
-- GRANTs erben automatisch vom existierenden Tabellen-Setup (ADD COLUMN
-- braucht keine zusätzlichen GRANTs).

ALTER TABLE public.subscriptions
  ADD COLUMN IF NOT EXISTS whop_payment_id TEXT;

CREATE INDEX IF NOT EXISTS idx_subscriptions_whop_payment_id
  ON public.subscriptions(whop_payment_id);
