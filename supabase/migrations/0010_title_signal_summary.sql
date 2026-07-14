-- Aggregated, YouTube-first evidence layer for serving recommendations.
-- This keeps request-time recommendation logic from ranking directly over raw
-- mentions while preserving the raw extracted evidence as the source of truth.

create table if not exists title_signal_summary (
  tmdb_id integer primary key references titles(tmdb_id) on delete cascade,
  source_count integer not null default 0,
  positive_mention_count integer not null default 0,
  negative_mention_count integer not null default 0,
  strongest_sentiment text,
  descriptor_counts jsonb not null default '{}'::jsonb,
  representative_summaries text[] not null default '{}',
  latest_mention_at timestamptz,
  evidence_score numeric(10, 2) not null default 0,
  updated_at timestamptz not null default now()
);

create index if not exists title_signal_summary_evidence_score_idx
  on title_signal_summary(evidence_score desc);

create index if not exists title_signal_summary_latest_mention_idx
  on title_signal_summary(latest_mention_at desc);

create or replace function refresh_title_signal_summary(target_tmdb_id integer)
returns void
language plpgsql
as $$
begin
  if target_tmdb_id is null then
    return;
  end if;

  delete from title_signal_summary where tmdb_id = target_tmdb_id;

  insert into title_signal_summary (
    tmdb_id,
    source_count,
    positive_mention_count,
    negative_mention_count,
    strongest_sentiment,
    descriptor_counts,
    representative_summaries,
    latest_mention_at,
    evidence_score,
    updated_at
  )
  with scoped_mentions as (
    select
      m.id,
      m.tmdb_id,
      m.sentiment,
      m.descriptors,
      m.quote_free_summary,
      m.created_at,
      v.curator_id,
      case m.sentiment
        when 'enthusiastic_rec' then 3
        when 'qualified_rec' then 2
        when 'notable_mention' then 1
        when 'neutral_reference' then 0
        when 'pan' then -3
        else 0
      end as sentiment_rank
    from mentions m
    join videos v on v.id = m.video_id
    where m.tmdb_id = target_tmdb_id
  ),
  descriptor_rollup as (
    select coalesce(jsonb_object_agg(descriptor, descriptor_count), '{}'::jsonb) as descriptor_counts
    from (
      select descriptor, count(*) as descriptor_count
      from scoped_mentions
      cross join lateral unnest(descriptors) as descriptor
      group by descriptor
    ) counted_descriptors
  ),
  representative as (
    select coalesce(array_agg(quote_free_summary order by sentiment_rank desc, created_at desc), '{}') as summaries
    from (
      select distinct on (quote_free_summary)
        quote_free_summary,
        sentiment_rank,
        created_at
      from scoped_mentions
      where sentiment in ('enthusiastic_rec', 'qualified_rec')
      order by quote_free_summary, sentiment_rank desc, created_at desc
      limit 3
    ) ranked_summaries
  ),
  aggregate_values as (
    select
      target_tmdb_id as tmdb_id,
      count(distinct curator_id)::integer as source_count,
      count(*) filter (where sentiment in ('enthusiastic_rec', 'qualified_rec'))::integer
        as positive_mention_count,
      count(*) filter (where sentiment = 'pan')::integer as negative_mention_count,
      (
        array_agg(sentiment order by sentiment_rank desc, created_at desc)
        filter (where sentiment is not null)
      )[1] as strongest_sentiment,
      max(created_at) as latest_mention_at,
      sum(greatest(sentiment_rank, 0)) as positive_signal,
      abs(sum(least(sentiment_rank, 0))) as negative_signal
    from scoped_mentions
  )
  select
    a.tmdb_id,
    a.source_count,
    a.positive_mention_count,
    a.negative_mention_count,
    a.strongest_sentiment,
    d.descriptor_counts,
    r.summaries,
    a.latest_mention_at,
    (
      coalesce(a.positive_signal, 0) * 2.0
      + a.source_count * 1.5
      + jsonb_object_length(d.descriptor_counts) * 0.25
      + (select count(*) from jsonb_object_keys(d.descriptor_counts)) * 0.25
      - coalesce(a.negative_signal, 0) * 2.5
    )::numeric(10, 2) as evidence_score,
    now()
  from aggregate_values a
  cross join descriptor_rollup d
  cross join representative r
  where a.positive_mention_count > 0 or a.negative_mention_count > 0;
end $$;

create or replace function refresh_title_signal_summary_from_mention()
returns trigger
language plpgsql
as $$
begin
  if tg_op in ('UPDATE', 'DELETE') then
    perform refresh_title_signal_summary(old.tmdb_id);
  end if;

  if tg_op in ('INSERT', 'UPDATE') then
    perform refresh_title_signal_summary(new.tmdb_id);
  end if;

  return null;
end $$;

drop trigger if exists refresh_title_signal_summary_mentions_trigger on mentions;
create trigger refresh_title_signal_summary_mentions_trigger
after insert or update or delete on mentions
for each row execute function refresh_title_signal_summary_from_mention();

select refresh_title_signal_summary(tmdb_id)
from (
  select distinct tmdb_id
  from mentions
  where tmdb_id is not null
) resolved_titles;
