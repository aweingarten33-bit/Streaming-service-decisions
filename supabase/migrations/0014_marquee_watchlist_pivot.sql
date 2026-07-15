-- Minimal pivot additions for Marquee: IMDb/import-ready watchlist state and
-- deterministic one-title decision sessions. Existing legacy pipeline tables
-- remain in place until data migration/cleanup is complete.
alter table viewer_watchlist
  add column if not exists id uuid default gen_random_uuid(),
  add column if not exists provider text not null default 'manual',
  add column if not exists provider_item_id text,
  add column if not exists imported_title text,
  add column if not exists imported_year integer,
  add column if not exists media_type text,
  add column if not exists status text not null default 'unwatched'
    check (status in ('unwatched', 'watched'));

create unique index if not exists viewer_watchlist_id_idx on viewer_watchlist(id);
create index if not exists viewer_watchlist_status_idx on viewer_watchlist(device_id, status);
