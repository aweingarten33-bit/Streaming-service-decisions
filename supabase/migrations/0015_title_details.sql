-- Adds plot synopsis and trailer data to the shared TMDB metadata cache.
-- Both are already fetched by getDetails() during import/enrichment but were
-- previously discarded before this migration -- upsert-title.ts now persists
-- them so the result card can show a plot blurb and trailer link alongside
-- the rating that was already cached in tmdb_rating.
alter table titles
  add column if not exists overview text,
  add column if not exists trailer_key text;
