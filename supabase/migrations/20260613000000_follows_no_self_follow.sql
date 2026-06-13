-- =====================================================
-- Self-Follow blockieren (13.06.2026)
--
-- Bug-Fix Follow-System: Bisher konnte ein User sich theoretisch
-- selbst folgen (follower_id = following_id). UI rendert den Folgen-
-- Button auf dem eigenen Profil nicht mehr, toggleFollow blockt
-- frühzeitig — diese Migration ist die dritte Verteidigungslinie auf
-- DB-Ebene.
--
-- Vorgehen:
--   1. Bestehende Self-Follows wegräumen (sonst schlägt der ADD
--      CHECK-Constraint fehl).
--   2. CHECK-Constraint hinzufügen.
--
-- Idempotent: DROP CONSTRAINT IF EXISTS davor. Die DELETE-Anweisung
-- ist bei erneutem Lauf nullop (keine Self-Follow-Zeilen mehr).
--
-- Anwendungspfad: per Supabase-MCP / supabase db push auf die
-- Production-DB anwenden, dann hier zur Versionierung im Repo.
-- =====================================================

-- 1. Cleanup vorhandener Self-Follows
DELETE FROM public.follows
WHERE follower_id = following_id;

-- 2. CHECK-Constraint
ALTER TABLE public.follows
  DROP CONSTRAINT IF EXISTS follows_no_self_follow;

ALTER TABLE public.follows
  ADD CONSTRAINT follows_no_self_follow
  CHECK (follower_id <> following_id);
