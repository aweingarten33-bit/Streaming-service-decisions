-- Allows "Add to my watchlist" from a saved Explore list (titles scraped
-- from a public IMDb list page, see scripts/pipeline/imdb-list-scrape.ts)
-- to be recorded as its own distinct import source, same as CSV/manual.
alter table watchlist_items drop constraint if exists watchlist_items_source_check;
alter table watchlist_items
  add constraint watchlist_items_source_check
  check (source in ('imdb_csv', 'letterboxd', 'trakt', 'csv', 'manual', 'imdb_list'));

alter table unresolved_imports drop constraint if exists unresolved_imports_source_check;
alter table unresolved_imports
  add constraint unresolved_imports_source_check
  check (source in ('imdb_csv', 'letterboxd', 'trakt', 'csv', 'manual', 'imdb_list'));
