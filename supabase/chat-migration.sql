-- Messages table
create table if not exists messages (
  id          bigserial    primary key,
  sender_id   integer      not null references profiles(id) on delete cascade,
  receiver_id integer      not null references profiles(id) on delete cascade,
  content     text         not null,
  created_at  timestamptz  default now()
);

-- Fast lookup by conversation pair
create index if not exists messages_conv_idx
  on messages (least(sender_id, receiver_id), greatest(sender_id, receiver_id), created_at);

-- Row Level Security
alter table messages enable row level security;

create policy "read own messages" on messages
  for select using (
    sender_id   in (select id from profiles where auth_id = auth.uid()) or
    receiver_id in (select id from profiles where auth_id = auth.uid())
  );

create policy "send to matches only" on messages
  for insert with check (
    sender_id in (select id from profiles where auth_id = auth.uid())
    and exists (
      select 1 from connections where user_id = sender_id  and target_id = receiver_id
    )
    and exists (
      select 1 from connections where user_id = receiver_id and target_id = sender_id
    )
  );

-- Enable Realtime
alter publication supabase_realtime add table messages;
