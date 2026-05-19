-- =====================================================
-- RLS-Fix: Owner darf application-Status updaten (19.05.2026)
--
-- Bug aus Family-Test Round 2: Flavio klickt "Akzeptieren" bei Naomis
-- Bewerbung → Frontend ruft UPDATE applications SET status='accepted'
-- → RLS blockt silent → status bleibt 'pending'.
--
-- Ursache: applications hatte nur SELECT/INSERT/DELETE-Policies, aber
-- keine UPDATE-Policy. Das Status-System aus Migration 20260518020000
-- braucht aber UPDATE-Rechte für Project-Owner.
--
-- Fix: UPDATE-Policy hinzufügen, die nur erlaubt wenn der User Owner
-- des betroffenen Projekts ist. Optimiert mit (SELECT auth.uid())
-- konsistent zu allen anderen RLS-Policies.
--
-- Diese Migration wurde am 19.05.2026 via Supabase-MCP direkt auf die
-- Production-DB angewendet. Sie liegt hier zur Versionierung im Repo.
-- =====================================================

CREATE POLICY "owners update application status" ON public.applications
FOR UPDATE TO authenticated
USING (
  project_id IN (
    SELECT projects.id FROM projects
    WHERE projects.user_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())
    )
  )
)
WITH CHECK (
  project_id IN (
    SELECT projects.id FROM projects
    WHERE projects.user_id IN (
      SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())
    )
  )
);
