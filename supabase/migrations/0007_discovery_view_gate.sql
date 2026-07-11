-- Discovery now gates on actual average view count of a channel's recent
-- videos instead of subscriber count, since subscriber count is a lagging,
-- unreliable signal for small niche curator channels.
alter table candidate_channels
  add column if not exists avg_view_count integer;
