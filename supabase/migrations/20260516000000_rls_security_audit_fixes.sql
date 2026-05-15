-- =====================================================
-- Security Audit Fixes (15.05.2026, applied 16.05.2026)
-- 9 RLS-Lücken aus dem Pre-Launch-Audit beseitigen.
--
-- Policies werden mit DROP-IF-EXISTS-Vorlauf neu angelegt,
-- damit die Migration mehrfach idempotent läuft. DROP-Listen
-- decken auch alternative Namen ab, die in Live-DB-Snapshots
-- vorhanden sein könnten (z.B. handgeschriebene Policies).
-- =====================================================


-- ─────────────────────────────────────────────────────
-- profiles: SELECT respektiert is_public (Default: true)
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public read profiles"      ON public.profiles;
DROP POLICY IF EXISTS "read public or own profile" ON public.profiles;

CREATE POLICY "read public or own profile"
  ON public.profiles
  FOR SELECT
  TO public
  USING (
    is_public = true
    OR auth.uid() = auth_id
  );


-- ─────────────────────────────────────────────────────
-- projects: anonyme INSERT/UPDATE schliessen
-- Replacement: nur Owner darf eigene Projekte
-- INSERTen / UPDATEn / DELETEn (Code in /projekte/neu,
-- /profil/projekte, /profil/projekte/[id]/bearbeiten).
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public insert projects"     ON public.projects;
DROP POLICY IF EXISTS "public update projects"     ON public.projects;
DROP POLICY IF EXISTS "users insert own projects"  ON public.projects;
DROP POLICY IF EXISTS "users update own projects"  ON public.projects;
DROP POLICY IF EXISTS "users delete own projects"  ON public.projects;

CREATE POLICY "users insert own projects"
  ON public.projects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "users update own projects"
  ON public.projects
  FOR UPDATE
  TO authenticated
  USING      (user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid()))
  WITH CHECK (user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid()));

CREATE POLICY "users delete own projects"
  ON public.projects
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────
-- connections: anonyme SELECT/INSERT schliessen
-- Replacement: User sieht/sendet/akzeptiert/löscht
-- nur eigene Connections. Empfänger darf den Status
-- updaten (accept/reject), beide Seiten dürfen löschen.
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public read connections"           ON public.connections;
DROP POLICY IF EXISTS "users can connect"                 ON public.connections;
DROP POLICY IF EXISTS "users see own connections"         ON public.connections;
DROP POLICY IF EXISTS "users send connections"            ON public.connections;
DROP POLICY IF EXISTS "recipients update connections"     ON public.connections;
DROP POLICY IF EXISTS "users delete own connections"      ON public.connections;
-- Alternative Namen, die in der Live-DB existieren könnten:
DROP POLICY IF EXISTS "users can read own connections"    ON public.connections;
DROP POLICY IF EXISTS "users can delete own connections"  ON public.connections;
DROP POLICY IF EXISTS "target can update connection status" ON public.connections;

CREATE POLICY "users see own connections"
  ON public.connections
  FOR SELECT
  TO authenticated
  USING (
    user_id   IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR target_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "users send connections"
  ON public.connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "recipients update connections"
  ON public.connections
  FOR UPDATE
  TO authenticated
  USING      (target_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid()))
  WITH CHECK (target_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid()));

CREATE POLICY "users delete own connections"
  ON public.connections
  FOR DELETE
  TO authenticated
  USING (
    user_id   IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR target_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────
-- follows: anonyme INSERT/DELETE schliessen
-- Replacement: nur eigene Follow-Beziehungen verwalten.
-- "public read follows" bleibt (Follows sind öffentlich
-- wie Twitter).
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users can follow"   ON public.follows;
DROP POLICY IF EXISTS "users can unfollow" ON public.follows;

CREATE POLICY "users can follow"
  ON public.follows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    follower_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "users can unfollow"
  ON public.follows
  FOR DELETE
  TO authenticated
  USING (
    follower_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────
-- applications: anonyme INSERT + öffentliche SELECT schliessen
-- Replacement: Bewerber sehen eigene Bewerbungen,
-- Projekt-Owner sehen Bewerbungen auf eigene Projekte.
-- Bewerber dürfen ihre Bewerbung zurückziehen (DELETE).
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "public read applications"             ON public.applications;
DROP POLICY IF EXISTS "users can apply"                      ON public.applications;
DROP POLICY IF EXISTS "applicants and owners see applications" ON public.applications;
DROP POLICY IF EXISTS "applicants withdraw own application"  ON public.applications;

CREATE POLICY "users can apply"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );

CREATE POLICY "applicants and owners see applications"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    OR project_id IN (
      SELECT id FROM public.projects
      WHERE user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
    )
  );

CREATE POLICY "applicants withdraw own application"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (
    user_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────
-- notifications: User dürfen nur eigene-gesendete
-- Notifications inserten. System-Notifications (ohne
-- sender_id, z.B. via DB-Trigger oder service_role)
-- bleiben erlaubt — RLS gilt für client-seitige Calls
-- mit anon/authenticated-Key.
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "system can insert notifications"        ON public.notifications;
DROP POLICY IF EXISTS "users can insert own-sent notifications" ON public.notifications;

CREATE POLICY "users can insert own-sent notifications"
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id IS NOT NULL
    AND sender_id IN (SELECT id FROM public.profiles WHERE auth_id = auth.uid())
  );


-- ─────────────────────────────────────────────────────
-- companies: Duplikat-Policy entfernen.
-- "public read companies" (rls.sql) bleibt.
-- ─────────────────────────────────────────────────────
DROP POLICY IF EXISTS "companies public read" ON public.companies;
