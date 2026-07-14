-- Personal, anonymous device-scoped watchlist. The mood-query feature only
-- ever picks from a device's own saved titles here -- never from the
-- curator-mentions catalog.
create table if not exists watchlist (
  device_id uuid not null,
  tmdb_id integer not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  added_at timestamptz not null default now(),
  primary key (device_id, tmdb_id, media_type)
);

create index if not exists watchlist_device_id_idx on watchlist(device_id);
