-- =====================================================
-- Realtime-Publication erweitern (18.05.2026)
--
-- Problem: Frontend-Realtime-Subscribes auf projects, connections,
-- applications registrieren sich erfolgreich, aber Supabase pusht
-- keine Events, weil die Tabellen nicht in der supabase_realtime
-- Publication sind. Folge:
-- - neue Projekte erscheinen nicht live in Liste (User muss Pull-to-refresh)
-- - Connect-Status-Updates (pending → accepted) kommen nicht live beim Sender
-- - geplantes Bewerbungs-Status-System würde auch nicht live laufen
--
-- Fix: Drei Tabellen zur Publication hinzufügen.
-- Plus REPLICA IDENTITY FULL für connections + applications damit
-- UPDATE-Events alle Spalten im Payload mitliefern (DEFAULT würde nur
-- PK liefern).
--
-- Live im Family-Test 18.05. mit Naomi gefunden: ihr neues Projekt
-- "hasen club" erschien bei Flavio erst nach Pull-to-refresh.
--
-- Diese Migration wurde am 18.05.2026 via Supabase-MCP direkt auf
-- die Production-DB angewendet. Sie liegt hier zur Versionierung
-- im Repo.
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
ALTER PUBLICATION supabase_realtime ADD TABLE public.applications;

ALTER TABLE public.connections REPLICA IDENTITY FULL;
ALTER TABLE public.applications REPLICA IDENTITY FULL;
