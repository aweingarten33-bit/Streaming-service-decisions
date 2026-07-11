-- Automated channel discovery: candidates are found via YouTube search,
-- quality-gated by actually sample-extracting their content (no human
-- review), and only the top 100 by score stay active in `curators`.

create table if not exists candidate_channels (
  id uuid primary key default gen_random_uuid(),
  youtube_channel_id text not null unique,
  channel_title text,
  discovery_query text,
  status text not null default 'pending' check (status in ('pending', 'promoted', 'rejected')),
  subscriber_count integer,
  yield_score numeric(5, 2),
  reject_reason text,
  evaluated_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists candidate_channels_status_idx on candidate_channels(status);

alter table curators
  add column if not exists discovery_source text not null default 'manual'
    check (discovery_source in ('manual', 'auto')),
  add column if not exists discovery_score numeric(5, 2);
