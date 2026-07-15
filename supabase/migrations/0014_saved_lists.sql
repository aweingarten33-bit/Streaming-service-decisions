-- Explore Lists: users can save a public IMDb list URL for later without the
-- app ever scraping or reproducing the list's contents -- a saved row always
-- opens the original list directly on IMDb. Scoped by device id, same as
-- every other table in 0013 -- no accounts.

create table if not exists saved_lists (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  url text not null,
  title text not null,
  description text,
  note text,
  created_at timestamptz not null default now(),
  unique (device_id, url)
);

create index if not exists saved_lists_device_id_idx on saved_lists(device_id);

alter table saved_lists enable row level security;
drop policy if exists "users manage their own saved lists" on saved_lists;
