-- Explore Lists: users can save a public IMDb list URL for later without the
-- app ever scraping or reproducing the list's contents -- a saved row always
-- opens the original list directly on IMDb.

create table if not exists saved_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  url text not null,
  title text not null,
  description text,
  note text,
  created_at timestamptz not null default now(),
  unique (user_id, url)
);

create index if not exists saved_lists_user_id_idx on saved_lists(user_id);

alter table saved_lists enable row level security;
drop policy if exists "users manage their own saved lists" on saved_lists;
create policy "users manage their own saved lists" on saved_lists
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
