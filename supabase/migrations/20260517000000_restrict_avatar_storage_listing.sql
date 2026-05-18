-- =====================================================
-- Storage-Härtung: Avatar-Listing einschränken (17.05.2026)
--
-- Problem: Die SELECT-Policy "Avatar images are publicly accessible"
-- erlaubte sowohl direkten URL-Zugriff als auch das Auflisten aller
-- Avatar-Files über die Storage API.
--
-- Lösung: SELECT-Policy droppen. Avatar-URLs bleiben trotzdem
-- erreichbar, weil der Bucket `avatars` public ist und Public-Buckets
-- automatisch über /storage/v1/object/public/{bucket}/{path} ausgeliefert
-- werden — ganz ohne RLS-Policy. Das API-Listing wird durch die fehlende
-- SELECT-Policy verhindert.
--
-- Diese Migration wurde am 17.05.2026 via Supabase-MCP direkt auf die
-- Production-DB angewendet. Sie liegt hier zur Versionierung im Repo.
-- =====================================================

DROP POLICY IF EXISTS "Avatar images are publicly accessible"
  ON storage.objects;
