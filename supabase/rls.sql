-- ============================================================
-- Founder Platform — Row Level Security Policies
-- Run this in the Supabase SQL Editor after schema.sql
-- ============================================================

-- Public read access for all tables
-- (For production, replace with auth-based policies)

create policy "public read profiles"
  on profiles for select using (true);

create policy "public read companies"
  on companies for select using (true);

create policy "public read projects"
  on projects for select using (true);

create policy "public read follows"
  on follows for select using (true);

create policy "public read connections"
  on connections for select using (true);

create policy "public read applications"
  on applications for select using (true);

-- Write access (insert/delete) — scoped to anon for demo
create policy "public insert follows"
  on follows for insert with check (true);

create policy "public delete follows"
  on follows for delete using (true);

create policy "public insert connections"
  on connections for insert with check (true);

create policy "public insert applications"
  on applications for insert with check (true);

create policy "public insert projects"
  on projects for insert with check (true);

-- Applicant counter update
create policy "public update projects"
  on projects for update using (true);

-- increment_applicants helper function
create or replace function increment_applicants(project_id integer)
returns void language sql security definer as $$
  update projects set applicants = applicants + 1 where id = project_id;
$$;
