-- =====================================================
-- applications.id-Spalte hinzufügen (19.05.2026)
--
-- Bug aus Family-Test Round 2: Frontend (Block B von Claude Code,
-- Commit 719ac81) referenziert applications.id im Server-Component
-- und in ApplicationsList als Identifier (.select("id,...") + React-key).
-- Aber die Tabelle hatte composite PK (project_id, user_id) und keine
-- id-Spalte. Folge: jede SELECT-Query wirft "column id does not exist",
-- returnt null, Empty-State greift.
--
-- Fix: id als bigint identity hinzufügen, neue PK auf id, alte
-- composite-Constraints als UNIQUE-Constraint für Anti-Doppel-Bewerbung
-- beibehalten.
--
-- Diese Migration wurde am 19.05.2026 via Supabase-MCP direkt auf die
-- Production-DB angewendet. Sie liegt hier zur Versionierung im Repo.
-- =====================================================

ALTER TABLE public.applications DROP CONSTRAINT IF EXISTS applications_pkey;

ALTER TABLE public.applications
  ADD COLUMN id bigint GENERATED ALWAYS AS IDENTITY;

ALTER TABLE public.applications ADD PRIMARY KEY (id);

ALTER TABLE public.applications
  ADD CONSTRAINT applications_project_user_unique UNIQUE (project_id, user_id);
