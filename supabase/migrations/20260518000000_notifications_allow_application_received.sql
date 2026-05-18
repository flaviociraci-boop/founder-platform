-- =====================================================
-- Fix: notifications.type CHECK-Constraint erweitern (18.05.2026)
--
-- Problem: notify_on_application-Trigger (Commit d9124c1) schreibt
-- type='application_received', der CHECK-Constraint lässt nur die
-- vier alten Types zu. Folge: jeder Bewerbungs-INSERT in applications
-- triggert den Notification-INSERT, der wirft → ganze Bewerbung rollt
-- zurück, User sieht "Bewerbung konnte nicht gesendet werden".
--
-- Live im Family-Test gefunden: Flavio's Bewerbung auf Gianfilippos
-- Projekt schlug genau hier fehl.
--
-- Fix: 'application_received' zum Constraint hinzufügen.
--
-- Diese Migration wurde am 18.05.2026 via Supabase-MCP direkt auf
-- die Production-DB angewendet. Sie liegt hier zur Versionierung
-- im Repo.
-- =====================================================

ALTER TABLE public.notifications
  DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE public.notifications
  ADD CONSTRAINT notifications_type_check CHECK (
    type = ANY (ARRAY[
      'connection_request'::text,
      'connection_accepted'::text,
      'new_message'::text,
      'new_project'::text,
      'application_received'::text
    ])
  );
