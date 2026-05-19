-- =====================================================
-- notifications zur Realtime-Publication hinzufügen (19.05.2026)
--
-- Problem: AppShell-Glocken-Counter (loadUnread) reagiert nicht live
-- auf neue Notifications. Verifiziert via Family-Test 19.05.: INSERT
-- in notifications kommt am Realtime-Subscribe gar nicht erst an.
--
-- Root-Cause: Die Tabelle notifications war nie in der
-- supabase_realtime-Publication. Migration 20260518010000 hatte nur
-- projects/connections/applications hinzugefügt.
--
-- Fix: notifications zur Publication adden + REPLICA IDENTITY FULL,
-- damit UPDATE-Events (mark-as-read) auch alle Spalten im Payload
-- mitliefern. Sonst greift der filter-lose Sub zwar, aber payload.new
-- enthält nur die id-Spalte → loadUnread() läuft trotzdem über SELECT,
-- also egal — FULL ist nur defensiv für zukünftige Delta-basierte
-- Updates.
-- =====================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
