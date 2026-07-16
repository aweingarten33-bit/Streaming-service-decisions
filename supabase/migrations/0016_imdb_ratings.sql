-- Real IMDb ratings, not TMDB's. TMDB's vote_average (tmdb_rating) comes
-- from TMDB's own much smaller voter pool and was being shown as if it were
-- "the" rating -- this adds IMDb's actual numbers, sourced from IMDb's
-- official non-commercial ratings dataset (datasets.imdbws.com), joined by
-- imdb_id. imdb_id itself was previously only used transiently to match CSV
-- import rows against TMDB and then discarded; this persists it so a
-- one-off sync script can backfill/refresh imdb_rating for every cached
-- title.
alter table titles
  add column if not exists imdb_id text,
  add column if not exists imdb_rating numeric(3, 1),
  add column if not exists imdb_vote_count integer;

create index if not exists titles_imdb_id_idx on titles(imdb_id) where imdb_id is not null;
