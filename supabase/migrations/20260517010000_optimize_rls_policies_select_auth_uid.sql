-- =====================================================
-- RLS-Performance-Optimierung (17.05.2026)
--
-- Problem: 26 Policies in public.* nutzen auth.uid() direkt.
-- Postgres evaluiert auth.uid() dann pro Row neu — bei großen
-- Tabellen wie messages/notifications führt das zu n-facher
-- Auswertung statt einmal pro Query.
--
-- Lösung: auth.uid() durch (SELECT auth.uid()) ersetzen.
-- Postgres-Planner erkennt das als initplan und cached den
-- Wert einmal pro Query → spürbarer Performance-Gewinn ab
-- ~50 concurrent Usern auf größeren Tabellen.
--
-- Methode: ALTER POLICY (atomic, kein DROP/CREATE-Window).
-- Logik der Policies bleibt 1:1 identisch — nur die
-- Auth-Function-Calls werden gewrapped.
--
-- Diese Migration wurde am 17.05.2026 via Supabase-MCP direkt
-- auf die Production-DB angewendet. Sie liegt hier zur
-- Versionierung im Repo.
-- =====================================================

-- applications
ALTER POLICY "applicants and owners see applications" ON public.applications
USING (
  (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
  OR
  (project_id IN (SELECT projects.id FROM projects WHERE projects.user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid()))))
);

ALTER POLICY "applicants withdraw own application" ON public.applications
USING (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "users can apply" ON public.applications
WITH CHECK (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

-- companies
ALTER POLICY "companies owner delete" ON public.companies
USING (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "companies owner insert" ON public.companies
WITH CHECK (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "companies owner update" ON public.companies
USING (profile_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

-- connections
ALTER POLICY "recipients update connections" ON public.connections
USING (target_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
WITH CHECK (target_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "users delete own connections" ON public.connections
USING (
  (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
  OR
  (target_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
);

ALTER POLICY "users see own connections" ON public.connections
USING (
  (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
  OR
  (target_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
);

ALTER POLICY "users send connections" ON public.connections
WITH CHECK (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

-- follows
ALTER POLICY "users can follow" ON public.follows
WITH CHECK (follower_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "users can unfollow" ON public.follows
USING (follower_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

-- messages
ALTER POLICY "read own messages" ON public.messages
USING (
  (sender_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
  OR
  (receiver_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
);

ALTER POLICY "send to matches only" ON public.messages
WITH CHECK (
  (sender_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
  AND
  (EXISTS (SELECT 1 FROM connections WHERE
    connections.status = 'accepted'
    AND (
      (connections.user_id = messages.sender_id AND connections.target_id = messages.receiver_id)
      OR
      (connections.user_id = messages.receiver_id AND connections.target_id = messages.sender_id)
    )
  ))
);

-- notifications
ALTER POLICY "users can delete own notifications" ON public.notifications
USING (recipient_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "users can insert own-sent notifications" ON public.notifications
WITH CHECK (
  (sender_id IS NOT NULL)
  AND
  (sender_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
);

ALTER POLICY "users can read own notifications" ON public.notifications
USING (recipient_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "users can update own notifications" ON public.notifications
USING (recipient_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

-- profiles (auth.uid() wird direkt verglichen, nicht in Subquery)
ALTER POLICY "read public or own profile" ON public.profiles
USING ((is_public = true) OR ((SELECT auth.uid()) = auth_id));

ALTER POLICY "users can insert own profile" ON public.profiles
WITH CHECK ((SELECT auth.uid()) = auth_id);

ALTER POLICY "users can update own profile" ON public.profiles
USING ((SELECT auth.uid()) = auth_id);

-- projects
ALTER POLICY "users can read projects" ON public.projects
USING (
  (status = ANY (ARRAY['active'::text, 'paused'::text]))
  OR
  (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
);

ALTER POLICY "users delete own projects" ON public.projects
USING (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "users insert own projects" ON public.projects
WITH CHECK (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

ALTER POLICY "users update own projects" ON public.projects
USING (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())))
WITH CHECK (user_id IN (SELECT profiles.id FROM profiles WHERE profiles.auth_id = (SELECT auth.uid())));

-- subscriptions
ALTER POLICY "users_select_own_subscription" ON public.subscriptions
USING ((SELECT auth.uid()) = user_id);
