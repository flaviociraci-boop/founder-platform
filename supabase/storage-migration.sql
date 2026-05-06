-- ============================================================
-- Avatar Storage — Run in Supabase SQL Editor
-- ============================================================

-- Create public avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Anyone can read avatars (public profile pictures)
create policy "avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- Logged-in users can upload
create policy "avatars authenticated upload"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'avatars');

-- Logged-in users can overwrite (upsert)
create policy "avatars authenticated update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars');

-- Logged-in users can delete their own
create policy "avatars authenticated delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars');
