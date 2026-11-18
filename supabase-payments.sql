-- Run once in Supabase Dashboard -> SQL Editor (after the original supabase-setup.sql).
-- Adds an optional payment link per artwork. Existing row-level-security policies
-- still apply: anyone can read, only the admin can write.
alter table public.artworks
  add column if not exists pay_link text not null default '';
