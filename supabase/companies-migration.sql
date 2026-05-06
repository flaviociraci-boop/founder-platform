-- ============================================================
-- Companies Table — Run in Supabase SQL Editor
-- ============================================================

create table if not exists public.companies (
  id          bigint generated always as identity primary key,
  profile_id  bigint not null references public.profiles(id) on delete cascade,
  name        text   not null,
  role        text   not null default '',
  type        text   not null default '',
  year        text   not null default '',
  active      boolean not null default true,
  created_at  timestamptz not null default now()
);

alter table public.companies enable row level security;

-- Public read (profiles are public)
create policy "companies public read"
  on public.companies for select
  using (true);

-- Owner can insert their own companies
create policy "companies owner insert"
  on public.companies for insert
  to authenticated
  with check (
    profile_id in (
      select id from public.profiles where auth_id = auth.uid()
    )
  );

-- Owner can update their own companies
create policy "companies owner update"
  on public.companies for update
  to authenticated
  using (
    profile_id in (
      select id from public.profiles where auth_id = auth.uid()
    )
  );

-- Owner can delete their own companies
create policy "companies owner delete"
  on public.companies for delete
  to authenticated
  using (
    profile_id in (
      select id from public.profiles where auth_id = auth.uid()
    )
  );
