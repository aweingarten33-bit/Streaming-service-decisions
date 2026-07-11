-- TMDB's own vote_average/vote_count — a second, free general-audience rating
-- source (different sample population than IMDb), captured from the same
-- /movie or /tv details call the pipeline already makes for every title.

alter table titles
  add column if not exists tmdb_rating numeric(3, 1),
  add column if not exists tmdb_vote_count integer;
