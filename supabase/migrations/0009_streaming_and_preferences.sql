-- Real streaming availability (US region, flatrate/subscription tier only)
-- from TMDB's watch/providers endpoint.
alter table titles
  add column if not exists streaming_providers text[] not null default '{}';
