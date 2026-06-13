-- =====================================================
-- Follow-Counts automatisch synchronisieren (13.06.2026)
--
-- Trigger auf public.follows hält profiles.followers und
-- profiles.following konsistent — INSERT inkrementiert, DELETE
-- dekrementiert (mit greatest(..., 0) gegen Underflow).
--
-- Plus initiales Backfill: zählt für jede Profile-Row die echten
-- follows neu, damit Bestandsdaten konsistent sind.
--
-- Idempotenz:
--   - create or replace function … (re-runnable)
--   - drop trigger if exists … vor create trigger
--   - UPDATE-Backfill ist auch bei zweitem Lauf neutral, weil sie
--     die counts auf die aktuellen Zählwerte setzt.
--
-- SECURITY DEFINER: keine zusätzlichen GRANTs nötig — der Trigger
-- läuft mit den Rechten des Funktions-Owners, authenticated braucht
-- nichts extra.
--
-- Diese Migration wurde am 13.06.2026 manuell auf der Production-DB
-- angewendet und liegt hier zur Versionierung im Repo. Re-Run ist
-- safe (siehe Idempotenz oben).
-- =====================================================

create or replace function public.sync_follow_counts()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (tg_op = 'INSERT') then
    update profiles set following = following + 1 where id = new.follower_id;
    update profiles set followers = followers + 1 where id = new.following_id;
  elsif (tg_op = 'DELETE') then
    update profiles set following = greatest(following - 1, 0) where id = old.follower_id;
    update profiles set followers = greatest(followers - 1, 0) where id = old.following_id;
  end if;
  return null;
end; $$;

drop trigger if exists trg_sync_follow_counts on public.follows;
create trigger trg_sync_follow_counts
  after insert or delete on public.follows
  for each row execute function public.sync_follow_counts();

update profiles p set
  followers = (select count(*) from follows f where f.following_id = p.id),
  following = (select count(*) from follows f where f.follower_id  = p.id);
