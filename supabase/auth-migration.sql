-- ============================================================
-- Auth Migration — Run in Supabase SQL Editor
-- Links profiles to Supabase Auth users
-- ============================================================

-- Add auth_id column to link profiles to auth.users
alter table profiles
  add column if not exists auth_id uuid unique references auth.users(id) on delete cascade;

-- Allow authenticated users to insert their own profile
create policy "users can insert own profile"
  on profiles for insert
  with check (auth.uid() = auth_id);

-- Allow authenticated users to update their own profile
create policy "users can update own profile"
  on profiles for update
  using (auth.uid() = auth_id);

-- Allow users to manage their own follows
drop policy if exists "public insert follows" on follows;
drop policy if exists "public delete follows" on follows;

create policy "users can follow"
  on follows for insert with check (true);

create policy "users can unfollow"
  on follows for delete using (true);

-- Allow users to send connections
drop policy if exists "public insert connections" on connections;

create policy "users can connect"
  on connections for insert with check (true);

-- Allow users to apply to projects
drop policy if exists "public insert applications" on applications;

create policy "users can apply"
  on applications for insert with check (true);
