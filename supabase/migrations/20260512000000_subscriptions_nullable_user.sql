-- Allows webhook to insert subscriptions before the user account exists.
-- user_id wird in Etappe 2 beim Register-Flow nachträglich verknüpft.
--
-- Status-Default wechselt von 'inactive' auf 'pending' — passt zum
-- Lifecycle in route.ts: pending → trial/active → past_due → canceled/expired.
-- Bewusst KEIN CHECK-Constraint auf status, damit neue Whop-Events keine
-- Migration erzwingen.

ALTER TABLE public.subscriptions
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.subscriptions
  ALTER COLUMN status SET DEFAULT 'pending';
