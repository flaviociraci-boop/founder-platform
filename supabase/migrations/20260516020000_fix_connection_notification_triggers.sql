-- =====================================================
-- FIX: Connection-Notification-Trigger (16.05.2026)
--
-- Bug: Beide Trigger-Funktionen schrieben NEW.id in
-- notifications.related_id — public.connections hat aber
-- keine id-Spalte (composite PK auf (user_id, target_id)).
-- Folge: jeder INSERT/UPDATE auf connections schlug mit
-- 'record "new" has no field "id"' silent fehl, weil die
-- Trigger als SECURITY DEFINER laufen.
--
-- Fix: related_id auf NULL setzen. Die Sender/Empfänger-
-- Identifikation ist bereits über sender_id und
-- recipient_id der notifications-Row gegeben; ein
-- separater related_id-Wert hätte ohnehin kein FK-Ziel
-- (related_id ist nullable, kein FK-Constraint).
-- =====================================================

CREATE OR REPLACE FUNCTION public.notify_on_connection_request()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO public.notifications (recipient_id, sender_id, type, related_id)
    VALUES (NEW.target_id, NEW.user_id, 'connection_request', NULL);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_on_connection_accepted()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (recipient_id, sender_id, type, related_id)
    VALUES (NEW.user_id, NEW.target_id, 'connection_accepted', NULL);
  END IF;
  RETURN NEW;
END;
$function$;
