-- =====================================================
-- Defensive Table GRANTs (16.05.2026)
--
-- Seit der Supabase-Data-API-Konvention (13.05.2026) müssen alle
-- Migrationen explizite GRANTs setzen — der vorherige Audit-Patch
-- (20260516000000) hat das vergessen. Diese Migration zieht die
-- nötigen GRANTs nach, sodass die seit dem Audit gehärteten
-- Policies nicht an fehlenden Tabellen-Privileges scheitern.
--
-- RLS bleibt der eigentliche Schutz; GRANTs sind nur die Tor-
-- öffnung dafür, dass anon/authenticated den Tabellen-Endpoint
-- überhaupt erreichen.
-- =====================================================

-- profiles: SELECT öffentlich (Policy filtert is_public),
-- INSERT/UPDATE nur authenticated
GRANT SELECT          ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE  ON public.profiles TO authenticated;

-- projects: SELECT öffentlich, CUD nur authenticated
GRANT SELECT                        ON public.projects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE        ON public.projects TO authenticated;

-- connections: ausschließlich authenticated (SELECT-Policy ist own-only)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.connections TO authenticated;

-- follows: SELECT öffentlich (Follows sind public), INSERT/DELETE authenticated
GRANT SELECT          ON public.follows TO anon, authenticated;
GRANT INSERT, DELETE  ON public.follows TO authenticated;

-- applications: authenticated, kein anon-SELECT mehr (per Audit)
GRANT SELECT, INSERT, DELETE ON public.applications TO authenticated;

-- notifications: nur authenticated; UPDATE für mark-as-read
GRANT SELECT, INSERT, UPDATE ON public.notifications TO authenticated;

-- companies: SELECT öffentlich, CUD authenticated (Owner-only via Policy)
GRANT SELECT                        ON public.companies TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE        ON public.companies TO authenticated;

-- Sequenzen für serial-PK-INSERTs (profiles, projects, companies …):
-- ohne USAGE/SELECT auf der Sequenz scheitert ein INSERT INTO mit
-- "permission denied for sequence".
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
