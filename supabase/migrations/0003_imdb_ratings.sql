-- IMDb ratings join. Rating/votes are a contextual signal only, never a hard
-- filter — surfaced together since a 6.1 with 4k votes and a 6.1 with 400k
-- votes mean very different things.

alter table titles
  add column if not exists imdb_id text,
  add column if not exists imdb_rating numeric(3, 1),
  add column if not exists imdb_votes integer,
  add column if not exists ratings_updated_at timestamptz;

create index if not exists titles_imdb_id_idx on titles(imdb_id);

-- Generalize pipeline_runs so non-extraction jobs (ratings sync, and Reddit
-- ingestion next) can log against the same table instead of overloading the
-- YouTube-specific columns.
alter table pipeline_runs
  add column if not exists run_type text not null default 'youtube_extraction',
  add column if not exists rows_updated integer,
  add column if not exists duration_ms integer;
