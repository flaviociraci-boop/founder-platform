-- =====================================================
-- Bewerbungs-Flow: optionale Nachricht + Notification an Projekt-Owner
-- (16.05.2026)
--
-- 1) message-Spalte für freien Bewerbungs-Text (max ~500 Zeichen
--    wird im Frontend enforced; DB-seitig nullable, kein Limit).
-- 2) Trigger schreibt bei jedem INSERT eine Notification an den
--    Projekt-Owner. Owner-Spalte heißt im Schema 'user_id'
--    (projects.user_id references profiles(id)), NICHT 'owner_id'.
--    Self-Application notifyt nicht (project_owner <> NEW.user_id).
--
-- Keine zusätzlichen GRANTs nötig: applications hat bereits
-- INSERT-Grant aus 20260516010000_explicit_grants.sql, der neue
-- Spalten automatisch mitdeckt. Trigger läuft SECURITY DEFINER
-- und schreibt notifications mit Owner-Rechten (RLS bypassed).
-- =====================================================

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS message TEXT;

CREATE OR REPLACE FUNCTION public.notify_on_application()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  project_owner integer;
BEGIN
  SELECT user_id INTO project_owner FROM public.projects WHERE id = NEW.project_id;
  IF project_owner IS NOT NULL AND project_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (recipient_id, sender_id, type, related_id)
    VALUES (project_owner, NEW.user_id, 'application_received', NEW.project_id);
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_application_trigger ON public.applications;
CREATE TRIGGER notify_application_trigger
  AFTER INSERT ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application();
