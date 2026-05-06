-- ============================================================
-- Comprehensive migration: run this in Supabase SQL Editor
-- Safe to run multiple times (all statements use IF NOT EXISTS)
-- ============================================================

-- 1. Chat messages table
create table if not exists messages (
  id         bigserial primary key,
  sender_id  integer not null references profiles(id) on delete cascade,
  receiver_id integer not null references profiles(id) on delete cascade,
  content    text not null,
  created_at timestamptz default now()
);

create index if not exists messages_conv_idx
  on messages (least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at);

alter table messages enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies where tablename = 'messages' and policyname = 'read own messages'
  ) then
    create policy "read own messages" on messages
      for select using (
        auth.uid() = (select auth_id from profiles where id = sender_id)
        or
        auth.uid() = (select auth_id from profiles where id = receiver_id)
      );
  end if;

  if not exists (
    select 1 from pg_policies where tablename = 'messages' and policyname = 'send to matches only'
  ) then
    create policy "send to matches only" on messages
      for insert with check (
        auth.uid() = (select auth_id from profiles where id = sender_id)
        and exists (
          select 1 from connections a
          join connections b
            on a.user_id = b.target_id and a.target_id = b.user_id
          where a.user_id = sender_id and a.target_id = receiver_id
        )
      );
  end if;
end $$;

-- Enable Realtime for messages
alter publication supabase_realtime add table messages;

-- 2. Profile columns
alter table profiles add column if not exists username text unique;
alter table profiles add column if not exists location text;
alter table profiles add column if not exists is_public boolean default true;
