-- Curator extraction pipeline: source channels, ingested videos, extracted
-- mentions, TMDB title cache, and per-run cost/volume tracking.

create extension if not exists pgcrypto;

create table if not exists curators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  youtube_channel_id text not null unique,
  url text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists videos (
  id uuid primary key default gen_random_uuid(),
  curator_id uuid not null references curators(id) on delete cascade,
  youtube_video_id text not null unique,
  title text not null,
  published_at timestamptz not null,
  description text,
  transcript_status text not null default 'pending'
    check (transcript_status in ('pending', 'available', 'unavailable')),
  extracted_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists videos_curator_id_idx on videos(curator_id);

-- TMDB title cache, keyed by TMDB's own id.
create table if not exists titles (
  tmdb_id integer primary key,
  title text not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  year integer,
  genres text[] not null default '{}',
  runtime integer,
  poster_path text,
  updated_at timestamptz not null default now()
);

create table if not exists mentions (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references videos(id) on delete cascade,
  tmdb_id integer references titles(tmdb_id),
  title_mentioned text not null,
  media_type text not null check (media_type in ('movie', 'tv', 'documentary', 'unknown')),
  year_hint integer,
  context_clues text,
  sentiment text not null
    check (sentiment in ('enthusiastic_rec', 'qualified_rec', 'notable_mention', 'pan', 'neutral_reference')),
  descriptors text[] not null default '{}',
  quote_free_summary text not null,
  resolution_confidence text
    check (resolution_confidence in ('exact', 'disambiguated', 'unresolved')),
  source_url text not null,
  created_at timestamptz not null default now()
);

create index if not exists mentions_tmdb_id_idx on mentions(tmdb_id);
create index if not exists mentions_sentiment_idx on mentions(sentiment);
create index if not exists mentions_video_id_idx on mentions(video_id);

create table if not exists pipeline_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  videos_processed integer not null default 0,
  mentions_extracted integer not null default 0,
  tokens_used integer not null default 0,
  cost_estimate numeric(10, 4) not null default 0
);
