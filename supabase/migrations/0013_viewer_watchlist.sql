-- Device-scoped personal watchlist. The recommender uses this as the first
-- candidate pool when a viewer has saved titles, keeping recommendations
-- focused on what the viewer already chose instead of generic discovery.
create table if not exists viewer_watchlist (
  device_id text not null,
  tmdb_id integer not null references titles(tmdb_id) on delete cascade,
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  primary key (device_id, tmdb_id)
);

create index if not exists viewer_watchlist_device_created_idx
  on viewer_watchlist(device_id, created_at desc);

alter table recommendation_traces
  add column if not exists watchlist_count integer not null default 0,
  add column if not exists used_watchlist boolean not null default false;
