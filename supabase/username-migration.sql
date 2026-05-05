-- Add username and visibility fields to profiles
alter table profiles add column if not exists username text unique;
alter table profiles add column if not exists is_public boolean default true;
