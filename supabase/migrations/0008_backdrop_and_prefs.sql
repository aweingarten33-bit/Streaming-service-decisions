-- Backdrop art for the cinematic home screen background.
alter table titles
  add column if not exists backdrop_path text;

-- Anonymous, device-scoped viewer preferences from onboarding — no auth, no
-- accounts. device_id is a UUID generated client-side and stored locally.
create table if not exists viewer_preferences (
  device_id uuid primary key,
  age_range text,
  watches_with text,
  streaming_services text[] not null default '{}',
  favorite_genres text[] not null default '{}',
  avoid_genres text[] not null default '{}',
  updated_at timestamptz not null default now()
);
