-- Real, persistent per-user watchlists backed by Supabase Auth (survives
-- device changes / reinstalls, unlike the old device_id-scoped `watchlist`
-- table from 0012, which is left in place untouched but no longer written to).
--
-- Schema is deliberately import-source-agnostic: `watchlist_items.source` and
-- `unresolved_imports.source` accept any import origin (imdb_csv today,
-- letterboxd/trakt/csv/manual later) without a schema change.

-- Shared TMDB metadata cache -- populated once per title regardless of which
-- user imported it, read by every watchlist/decide/widget request.
create table if not exists titles (
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  title text not null,
  year integer,
  genres text[] not null default '{}',
  runtime integer,
  poster_path text,
  backdrop_path text,
  streaming_providers text[] not null default '{}',
  tmdb_rating numeric(3, 1),
  tmdb_vote_count integer,
  updated_at timestamptz not null default now(),
  primary key (tmdb_id, media_type)
);

alter table titles enable row level security;
drop policy if exists "titles are publicly readable" on titles;
create policy "titles are publicly readable" on titles for select using (true);
-- No insert/update/delete policy: only the service-role key (which bypasses
-- RLS) writes here, from resolution/import/backfill code paths.

create table if not exists watchlist_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  status text not null default 'active' check (status in ('active', 'watched')),
  source text not null default 'manual' check (source in ('imdb_csv', 'letterboxd', 'trakt', 'csv', 'manual')),
  imported_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (user_id, tmdb_id, media_type),
  foreign key (tmdb_id, media_type) references titles(tmdb_id, media_type) on delete cascade
);

create index if not exists watchlist_items_user_id_idx on watchlist_items(user_id);

alter table watchlist_items enable row level security;
drop policy if exists "users manage their own watchlist items" on watchlist_items;
create policy "users manage their own watchlist items" on watchlist_items
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Import rows that couldn't be confidently resolved to a TMDB title -- surfaced
-- back to the user ("Review the 2 Weird Ones") instead of silently dropped.
create table if not exists unresolved_imports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  raw_title text,
  raw_year integer,
  source text not null default 'manual' check (source in ('imdb_csv', 'letterboxd', 'trakt', 'csv', 'manual')),
  created_at timestamptz not null default now()
);

create index if not exists unresolved_imports_user_id_idx on unresolved_imports(user_id);

alter table unresolved_imports enable row level security;
drop policy if exists "users manage their own unresolved imports" on unresolved_imports;
create policy "users manage their own unresolved imports" on unresolved_imports
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  language text not null default 'unfiltered' check (language in ('unfiltered', 'clean')),
  updated_at timestamptz not null default now()
);

alter table user_settings enable row level security;
drop policy if exists "users manage their own settings" on user_settings;
create policy "users manage their own settings" on user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
