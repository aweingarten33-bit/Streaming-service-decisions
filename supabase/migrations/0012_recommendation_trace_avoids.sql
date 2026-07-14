-- Track negative vibe constraints inferred from user prompts, e.g. "not depressing".
alter table recommendation_traces
  add column if not exists avoided_descriptors text[] not null default '{}';
