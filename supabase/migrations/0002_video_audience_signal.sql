-- Aggregate audience-comment sentiment per video (via YouTube commentThreads.list).
-- Never stores raw comment text, same rule as mentions.quote_free_summary.

alter table videos
  add column if not exists audience_sentiment_score numeric(3, 2),
  add column if not exists audience_summary text,
  add column if not exists comments_analyzed_at timestamptz;
