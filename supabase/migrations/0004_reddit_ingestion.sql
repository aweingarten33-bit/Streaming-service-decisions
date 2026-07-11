-- Reddit as a second source type feeding the same mentions table. Rather than
-- generalizing the existing YouTube-specific `videos` table (which every
-- existing script references directly), Reddit gets its own parallel table
-- and `mentions` gains a second nullable FK — the shared, unified surface
-- stays the `mentions` table itself, same as the spec asks for.

create table if not exists reddit_threads (
  id uuid primary key default gen_random_uuid(),
  subreddit text not null,
  reddit_thread_id text not null unique,
  title text not null,
  permalink text not null,
  score integer not null,
  num_comments integer not null,
  fetched_at timestamptz not null default now(),
  extracted_at timestamptz
);

create index if not exists reddit_threads_subreddit_idx on reddit_threads(subreddit);

alter table mentions
  alter column video_id drop not null,
  add column if not exists reddit_thread_id uuid references reddit_threads(id) on delete cascade,
  add column if not exists weight numeric(4, 2);

alter table mentions
  drop constraint if exists mentions_exactly_one_source;
alter table mentions
  add constraint mentions_exactly_one_source
    check ((video_id is not null)::int + (reddit_thread_id is not null)::int = 1);

-- Widen sentiment to include taste_anchor (Reddit "shows like Dark?" requests
-- mention a title as a taste reference, not a recommendation). Postgres has
-- no ALTER CHECK, and the auto-generated constraint name isn't guaranteed,
-- so find and drop whatever it actually is before adding the new one.
do $$
declare
  existing_constraint text;
begin
  select con.conname into existing_constraint
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  join pg_attribute att on att.attrelid = rel.oid and att.attnum = any(con.conkey)
  where rel.relname = 'mentions'
    and att.attname = 'sentiment'
    and con.contype = 'c';

  if existing_constraint is not null then
    execute format('alter table mentions drop constraint %I', existing_constraint);
  end if;
end $$;

alter table mentions add constraint mentions_sentiment_check
  check (sentiment in (
    'enthusiastic_rec', 'qualified_rec', 'notable_mention', 'pan', 'neutral_reference', 'taste_anchor'
  ));
