-- Pipeline reliability metadata: transcript failure reasons, prompt/model
-- provenance, extraction run records, and recommendation traces.

create table if not exists extraction_runs (
  id uuid primary key default gen_random_uuid(),
  run_at timestamptz not null default now(),
  prompt_version text not null,
  model text not null,
  video_id uuid references videos(id) on delete set null,
  status text not null default 'started'
    check (status in ('started', 'succeeded', 'skipped_no_transcript', 'failed')),
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  mentions_extracted integer not null default 0,
  error_message text
);

alter table mentions
  add column if not exists extraction_run_id uuid references extraction_runs(id) on delete set null,
  add column if not exists extraction_prompt_version text,
  add column if not exists extraction_model text;

create index if not exists mentions_extraction_run_id_idx on mentions(extraction_run_id);
create index if not exists mentions_extraction_prompt_version_idx on mentions(extraction_prompt_version);

alter table videos
  add column if not exists transcript_failure_reason text,
  add column if not exists transcript_failure_detail text,
  add column if not exists transcript_attempt_count integer not null default 0,
  add column if not exists transcript_last_attempt_at timestamptz;

create index if not exists videos_transcript_failure_reason_idx on videos(transcript_failure_reason);
create index if not exists videos_transcript_retry_idx
  on videos(transcript_status, extracted_at, transcript_last_attempt_at);

create table if not exists recommendation_traces (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  device_id text,
  prompt text,
  parsed_filters jsonb not null default '{}'::jsonb,
  candidate_source text not null,
  wanted_genres text[] not null default '{}',
  requested_descriptors text[] not null default '{}',
  candidate_count integer not null default 0,
  scored_count integer not null default 0,
  rerank_used boolean not null default false,
  chosen_tmdb_ids integer[] not null default '{}'
);

create index if not exists recommendation_traces_created_at_idx
  on recommendation_traces(created_at desc);

create or replace function increment_transcript_attempt_count(target_video_id uuid)
returns void
language sql
as $$
  update videos
  set transcript_attempt_count = coalesce(transcript_attempt_count, 0) + 1
  where id = target_video_id;
$$;
