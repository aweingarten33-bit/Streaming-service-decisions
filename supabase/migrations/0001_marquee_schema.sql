create extension if not exists pgcrypto;

create table if not exists devices (
  id text primary key,
  created_at timestamptz not null default now()
);

create table if not exists titles (
  tmdb_id integer primary key,
  imdb_id text unique,
  title text not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  year integer,
  genres text[] not null default '{}',
  runtime integer,
  poster_path text,
  backdrop_path text,
  streaming_providers text[] not null default '{}',
  tmdb_rating numeric(3, 1),
  tmdb_vote_count integer,
  updated_at timestamptz not null default now()
);

create table if not exists viewer_watchlist (
  id uuid not null default gen_random_uuid(),
  device_id text not null references devices(id) on delete cascade,
  tmdb_id integer not null references titles(tmdb_id) on delete cascade,
  provider text not null default 'manual',
  source text not null default 'manual',
  provider_item_id text,
  imported_title text,
  imported_year integer,
  media_type text,
  status text not null default 'unwatched' check (status in ('unwatched', 'watched')),
  created_at timestamptz not null default now(),
  primary key (device_id, tmdb_id)
);

create unique index if not exists viewer_watchlist_id_idx on viewer_watchlist(id);
create index if not exists viewer_watchlist_status_idx on viewer_watchlist(device_id, status);
create index if not exists viewer_watchlist_created_idx on viewer_watchlist(device_id, created_at desc);

create table if not exists recommendation_traces (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  device_id text references devices(id) on delete set null,
  prompt text not null,
  parsed_filters jsonb not null default '{}'::jsonb,
  candidate_source text not null default 'watchlist_decision',
  wanted_genres text[] not null default '{}',
  requested_descriptors text[] not null default '{}',
  avoided_descriptors text[] not null default '{}',
  watchlist_count integer not null default 0,
  used_watchlist boolean not null default true,
  candidate_count integer not null default 0,
  scored_count integer not null default 0,
  rerank_used boolean not null default false,
  chosen_tmdb_ids integer[] not null default '{}'
);

create index if not exists recommendation_traces_created_at_idx
  on recommendation_traces(created_at desc);
