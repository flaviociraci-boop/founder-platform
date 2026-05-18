-- =====================================================
-- Applications Status-System + Notification-Trigger
-- (18.05.2026)
--
-- - status-Spalte mit CHECK-Constraint (pending/accepted/rejected)
-- - updated_at-Spalte
-- - notifications.type-Constraint um application_accepted/_rejected erweitert
-- - Trigger schreibt Notification an Bewerber bei Status-Wechsel
--
-- WICHTIG: muss VOR Deploy des dazugehörigen UI-Code-Commits in Supabase
-- ausgeführt werden — sonst crasht das UI beim Lesen von applications.status.
-- =====================================================

-- 1) Applications: status + updated_at
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';

-- IF NOT EXISTS gibt es für CONSTRAINTs nicht — DO-Block für Idempotenz.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conrelid = 'public.applications'::regclass
      AND conname = 'applications_status_check'
  ) THEN
    ALTER TABLE public.applications
      ADD CONSTRAINT applications_status_check
      CHECK (status IN ('pending', 'accepted', 'rejected'));
  END IF;
END$$;

ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Notifications-Type-Constraint erweitern (existing types + 2 neue)
ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type = ANY (ARRAY[
      'connection_request'::text,
      'connection_accepted'::text,
      'new_message'::text,
      'new_project'::text,
      'application_received'::text,
      'application_accepted'::text,
      'application_rejected'::text
    ])
  );

-- 3) Trigger: bei Status-Wechsel pending → accepted/rejected
--    Notification an den Bewerber schreiben (sender = Projekt-Owner).
CREATE OR REPLACE FUNCTION public.notify_on_application_status_change()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
DECLARE
  project_owner integer;
BEGIN
  IF OLD.status = 'pending' AND NEW.status IN ('accepted', 'rejected') THEN
    SELECT user_id INTO project_owner
    FROM public.projects
    WHERE id = NEW.project_id;

    INSERT INTO public.notifications (recipient_id, sender_id, type, related_id)
    VALUES (
      NEW.user_id,
      project_owner,
      CASE NEW.status
        WHEN 'accepted' THEN 'application_accepted'
        ELSE 'application_rejected'
      END,
      NEW.project_id
    );
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS notify_application_status_change_trigger ON public.applications;
CREATE TRIGGER notify_application_status_change_trigger
  AFTER UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.notify_on_application_status_change();
