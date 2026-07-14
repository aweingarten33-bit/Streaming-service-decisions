# Product Pivot Audit & Redesign Plan: Marquee

This document is the requested architecture review and pivot plan. It describes what exists in the repository today, evaluates it against the new product strategy, and proposes the smallest long-term architecture for one job: help someone stop scrolling and actually watch something tonight.

## 0. Executive verdict

The current codebase is not aligned with the new product. It is mostly a YouTube/Reddit curator ingestion and recommendation intelligence platform with a lightweight watchlist bolted on. The new product should be a personal watchlist decision tool.

Ruthless conclusion:

- Keep the Next.js app shell, Supabase, TMDB title metadata, and a tiny Claude intent parser.
- Rewrite the product UX around IMDb CSV import, one home screen, one answer, and a simple watchlist.
- Delete or archive almost all YouTube, Reddit, curator, channel discovery, ratings-sync, and cinematic/landing animation code from the runtime product.
- Replace the recommendation pipeline with deterministic watchlist scoring over user-owned titles and title traits.
- Use AI only to translate natural language into structured intent. AI must not choose titles.

## 1. Current repository map

### 1.1 Screens and pages

| Path                            | Current screen   | What exists                                                                         | Verdict                                                                                           |
| ------------------------------- | ---------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `src/app/page.tsx`              | Home             | Fetches popular title backdrops from Supabase and renders `AppShell`.               | REWRITE: home should not query popular backdrops; it should be a static, fast decision screen.    |
| `src/app/how-it-works/page.tsx` | Explanation page | Explains trusted curator recommendation intelligence and anti-trending positioning. | DELETE: old vision. New product is personal watchlist decision support.                           |
| `src/app/error.tsx`             | Error boundary   | Generic app-level error page.                                                       | KEEP, simplify copy later.                                                                        |
| `src/app/not-found.tsx`         | 404 page         | Generic missing page.                                                               | KEEP.                                                                                             |
| `src/app/layout.tsx`            | Root layout      | Metadata, global CSS, grain overlay, page shell.                                    | SIMPLIFY: update metadata to Marquee, remove decorative global grain if it hurts calm/minimal UX. |

### 1.2 Current user-facing components

| Component                            | What exists                                                                                                   | Verdict                                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `src/components/dj/app-shell.tsx`    | Directly renders `WatchDj`. Previous onboarding is bypassed.                                                  | KEEP as a thin shell, rename to product-neutral shell.                                      |
| `src/components/dj/watch-dj.tsx`     | Main chat-like prompt UI, rotating chips, recommendation cards, voice input, detail modal stack, save action. | REWRITE: should return exactly one title, not cards; rename to Home decision screen.        |
| `src/components/dj/title-detail.tsx` | Full title detail modal with trailers, metadata, cast, providers, and “More Like This.”                       | DELETE or radically simplify: new product forbids recommendation rows and “More Like This.” |
| `src/components/dj/onboarding.tsx`   | Old preference onboarding: watches-with, streaming services, favorite/avoid genres.                           | DELETE/REWRITE: replace with IMDb import onboarding.                                        |
| `src/components/fx/*`                | Large animation/effect toolkit: particles, cursors, wipes, kinetic headings, shaders, smooth scroll, etc.     | DELETE from product runtime. Keep only if a marketing page exists later.                    |
| `src/components/journey/*`           | Cinematic scrolling journey components.                                                                       | DELETE.                                                                                     |
| `src/components/landing/*`           | Landing/marketing components from prior product explorations.                                                 | DELETE or move to archive.                                                                  |
| `src/components/punk/*`              | Another visual system / landing style.                                                                        | DELETE or move to archive.                                                                  |
| `src/components/ui/*`                | Shadcn/Radix-style UI primitives.                                                                             | SIMPLIFY: keep only primitives actually used by the new app.                                |

### 1.3 Current API routes

| Route                            | Current behavior                                                                                                                                                                                                                                       | Verdict                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/recommend`            | Parses prompt with Claude, merges deterministic descriptor patterns, loads watchlist IDs if present, queries `title_signal_summary` or raw mentions, scores many candidates, optionally reranks with Claude, returns up to three results, logs traces. | REWRITE: should parse intent only, deterministic score only watchlist items, return exactly one title. Delete LLM rerank. |
| `GET/POST/DELETE /api/watchlist` | Device-scoped watchlist list/save/remove for TMDB IDs.                                                                                                                                                                                                 | KEEP but rewrite around imported watchlist items, watched status, provider source, import batch IDs, and search/sort.     |
| `GET /api/title/[tmdbId]`        | Fetches title metadata and TMDB details, returns “More Like This.”                                                                                                                                                                                     | SIMPLIFY/DELETE: only needed for a focused title detail or play decision. Remove “More Like This.”                        |
| `GET/POST /api/preferences`      | Device-scoped onboarding preferences.                                                                                                                                                                                                                  | DELETE: new product says no filters and no preference onboarding.                                                         |

### 1.4 Current services and utilities

| File                                                                | Current behavior                                                           | Verdict                                                                                                    |
| ------------------------------------------------------------------- | -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/lib/pipeline/env.ts`                                           | Zod-validated env for YouTube, Anthropic, TMDB, Supabase, optional Reddit. | REWRITE: split runtime env from deprecated pipeline env; new runtime needs Supabase, TMDB, Anthropic only. |
| `src/lib/pipeline/llm.ts`                                           | Shared Claude JSON helper with retry and markdown-fence stripping.         | KEEP/SIMPLIFY: use for intent parsing only.                                                                |
| `src/lib/pipeline/supabase.ts`                                      | Supabase service-role client.                                              | KEEP server-side only; add browser-safe client only if needed later.                                       |
| `src/lib/pipeline/tmdb.ts`                                          | TMDB search/details/external IDs/watch providers with retry.               | KEEP: needed for IMDb CSV matching and metadata enrichment.                                                |
| `src/lib/pipeline/youtube.ts`                                       | YouTube Data API wrapper.                                                  | DELETE from new product runtime.                                                                           |
| `src/lib/pipeline/transcript.ts`                                    | YouTube transcript fetch/chunking.                                         | DELETE from new product runtime.                                                                           |
| `src/lib/pipeline/reddit.ts`                                        | Reddit OAuth/API wrapper.                                                  | DELETE.                                                                                                    |
| `src/lib/pipeline/types.ts`                                         | Types for curator videos/mentions/pipeline.                                | REWRITE for watchlist/import/title traits.                                                                 |
| `src/lib/device-id.ts`                                              | Client-side anonymous device ID.                                           | KEEP for no-auth MVP, but design schema so real users can be added later.                                  |
| `src/lib/utils.ts`, `src/lib/motion.ts`, `src/hooks/use-mobile.tsx` | Generic UI utilities.                                                      | KEEP only if used.                                                                                         |

### 1.5 Current background jobs and scripts

| Script                                           | Current behavior                                                           | Verdict                                                                                          |
| ------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `scripts/pipeline/01-ingest-videos.ts`           | Upserts configured/auto curators and YouTube videos.                       | DELETE.                                                                                          |
| `scripts/pipeline/02-extract-mentions.ts`        | Fetches transcripts, Claude extraction prompt, stores mentions/provenance. | DELETE.                                                                                          |
| `scripts/pipeline/03-resolve-tmdb.ts`            | Resolves mentions to TMDB with search and Claude disambiguation.           | DELETE/REUSE PARTS: keep TMDB resolution ideas for IMDb import matching, but not as this script. |
| `scripts/pipeline/04-analyze-comments.ts`        | Claude sentiment analysis of YouTube comments.                             | DELETE.                                                                                          |
| `scripts/pipeline/05-ingest-reddit.ts`           | Reddit thread ingestion.                                                   | DELETE.                                                                                          |
| `scripts/pipeline/06-extract-reddit-mentions.ts` | Claude extraction from Reddit threads.                                     | DELETE.                                                                                          |
| `scripts/pipeline/07-discover-channels.ts`       | YouTube channel discovery.                                                 | DELETE.                                                                                          |
| `scripts/pipeline/08-evaluate-candidates.ts`     | Evaluates candidate channels with extraction yield.                        | DELETE.                                                                                          |
| `scripts/pipeline/ratings-sync.ts`               | IMDb ratings dataset sync and TMDB metadata refresh.                       | DELETE for MVP; user CSV import and TMDB metadata are enough.                                    |
| `scripts/pipeline/audit-youtube-bank.ts`         | Audits curator/video/extraction coverage.                                  | DELETE.                                                                                          |
| `scripts/pipeline/report.ts`                     | Pipeline report.                                                           | DELETE.                                                                                          |
| `scripts/pipeline/run-one-curator.ts`            | Single-curator pipeline.                                                   | DELETE.                                                                                          |
| `scripts/eval/recommendation-fixtures.ts`        | Checks descriptor taxonomy coverage for example prompts.                   | REWRITE into intent-parser tests and deterministic recommender fixtures.                         |

### 1.6 Current scheduled workflows

| Workflow                                 | Current behavior                                                                         | Verdict |
| ---------------------------------------- | ---------------------------------------------------------------------------------------- | ------- |
| `.github/workflows/daily-pipeline.yml`   | Runs YouTube ingest, extraction, TMDB resolution, comments, ratings sync, YouTube audit. | DELETE. |
| `.github/workflows/weekly-discovery.yml` | Discovers/evaluates YouTube channels.                                                    | DELETE. |

### 1.7 Current configuration files

| File                           | Current purpose                 | Verdict                                                    |
| ------------------------------ | ------------------------------- | ---------------------------------------------------------- |
| `config/curators.ts`           | Manual YouTube curator sources. | DELETE.                                                    |
| `config/discovery-queries.ts`  | YouTube discovery queries.      | DELETE.                                                    |
| `config/subreddits.ts`         | Reddit source config.           | DELETE.                                                    |
| `config/descriptors.ts`        | Title vibe taxonomy.            | REWRITE as `titleTraits` with only decision-useful traits. |
| `config/genres.ts`             | TMDB genre names.               | KEEP as metadata support, not UI filters.                  |
| `config/streaming-services.ts` | Streaming provider list.        | KEEP only if import/settings needs provider availability.  |

### 1.8 Current external APIs

| API                  | Current use                                                                  | Verdict                                                             |
| -------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Supabase             | Database for all app/pipeline data.                                          | KEEP.                                                               |
| Anthropic Claude     | Extraction, disambiguation, comments, request parse, rerank, discovery eval. | SIMPLIFY: only natural-language-to-intent parsing.                  |
| TMDB                 | Search, details, metadata, watch providers.                                  | KEEP.                                                               |
| IMDb dataset         | Ratings sync.                                                                | DELETE for MVP; imported IMDb CSV is a user file, not dataset sync. |
| YouTube Data API     | Curator/video/comment/discovery.                                             | DELETE.                                                             |
| `youtube-transcript` | Transcript scraping.                                                         | DELETE.                                                             |
| Reddit OAuth/API     | Reddit ingestion/extraction.                                                 | DELETE.                                                             |

### 1.9 Current dependencies

Current runtime dependencies include Next, React, Supabase, Anthropic SDK, TMDB via native fetch, `youtube-transcript`, many Radix UI primitives, charting, animation libraries (`framer-motion`, `gsap`, `three`, `lenis`), carousel, date utilities, and form utilities.

Verdict:

- KEEP: `next`, `react`, `react-dom`, `@supabase/supabase-js`, `@anthropic-ai/sdk`, `zod`, `lucide-react`, `clsx`, `tailwind-merge`.
- SIMPLIFY: Radix/UI primitives to only the components used by Home, Watchlist, Settings, Import.
- DELETE: `youtube-transcript`, `three`, `gsap`, `lenis`, carousel/chart/form dependencies unless actually used in the rebuilt app.

### 1.10 Current environment variables

| Env var                                    | Current purpose              | Verdict                                 |
| ------------------------------------------ | ---------------------------- | --------------------------------------- |
| `SUPABASE_URL`                             | Supabase connection.         | KEEP.                                   |
| `SUPABASE_SERVICE_ROLE_KEY`                | Server-side Supabase.        | KEEP; ensure never exposed client-side. |
| `TMDB_API_KEY`                             | Title matching and metadata. | KEEP.                                   |
| `ANTHROPIC_API_KEY`                        | Many AI calls.               | KEEP only for intent parser.            |
| `YOUTUBE_API_KEY`                          | YouTube pipeline.            | DELETE.                                 |
| `REDDIT_CLIENT_ID`, `REDDIT_CLIENT_SECRET` | Reddit pipeline.             | DELETE.                                 |

## 2. Complete current data flow

### 2.1 Existing curator ingestion flow

1. `config/curators.ts` and auto curators from `curators` define source channels.
2. `01-ingest-videos.ts` calls YouTube APIs and writes `curators` and `videos`.
3. `02-extract-mentions.ts` fetches transcripts with `youtube-transcript`, chunks them, calls Claude extraction, dedupes mentions, writes `mentions` and `extraction_runs`.
4. `03-resolve-tmdb.ts` searches TMDB and sometimes calls Claude to disambiguate, then writes `titles` and resolved `mentions.tmdb_id`.
5. `0010_title_signal_summary.sql` trigger aggregates YouTube mentions into `title_signal_summary`.
6. `/api/recommend` queries `title_signal_summary` first, falls back to raw YouTube mentions, scores/reranks, and returns three picks.

Verdict: DELETE. This no longer serves the product pivot.

### 2.2 Existing watchlist flow

1. UI loads existing saved IDs from `/api/watchlist?deviceId=...`.
2. User can save a recommendation card.
3. `/api/watchlist` upserts `device_id + tmdb_id` into `viewer_watchlist`.
4. `/api/recommend` loads watchlist IDs and constrains candidates to those IDs if any exist.

Verdict: KEEP concept, REWRITE implementation around import-first watchlists, watched status, and exactly-one recommendation.

### 2.3 Existing recommendation flow

1. User types prompt in `WatchDj`.
2. Client calls `/api/recommend` with `prompt`, `deviceId`, `excludeIds`, and previous filters.
3. Claude parses prompt into descriptors/genres/runtime/reference title.
4. Regex intent enrichment adds descriptors and avoid descriptors.
5. API optionally enriches from reference title evidence.
6. API queries watchlist-constrained or global `title_signal_summary`.
7. It scores candidates deterministically.
8. Claude reranks a shortlist of 12.
9. API returns up to three results.
10. UI renders multiple cards with details/save/not-for-me.

Verdict: REWRITE. New flow should parse intent once, score personal watchlist deterministically, return exactly one title, and never rerank with AI.

## 3. Existing database schema

Current tables:

- `curators`: YouTube curator sources.
- `videos`: YouTube videos and transcript state.
- `titles`: TMDB metadata cache plus ratings, backdrop, streaming providers.
- `mentions`: extracted YouTube/Reddit evidence mentions.
- `pipeline_runs`: pipeline run metrics.
- `reddit_threads`: Reddit source threads.
- `candidate_channels`: YouTube discovery candidates.
- `viewer_preferences`: device-scoped old onboarding preferences.
- `title_signal_summary`: aggregated YouTube evidence by title.
- `extraction_runs`: prompt/model provenance for transcript extraction.
- `recommendation_traces`: recommendation serving diagnostics.
- `viewer_watchlist`: device-scoped saved TMDB title IDs.

Ruthless schema verdict:

- KEEP/REWRITE: `titles` -> `titles` with only TMDB metadata needed for watchlist decisions.
- KEEP/REWRITE: `viewer_watchlist` -> `watchlist_items` with provider/import/watched fields.
- KEEP/SIMPLIFY: `recommendation_traces` -> `recommendation_sessions` and `recommendation_feedback`.
- DELETE: `curators`, `videos`, `mentions`, `pipeline_runs`, `reddit_threads`, `candidate_channels`, `viewer_preferences`, `title_signal_summary`, `extraction_runs`.

## 4. Existing prompts and AI calls

Current prompts/calls:

1. YouTube extraction prompt: transcript -> structured mentions.
2. TMDB disambiguation prompt: candidates -> chosen candidate/null.
3. Comment analysis prompt: YouTube comments -> sentiment summary.
4. Reddit extraction prompt: thread/comments -> structured mentions.
5. Candidate evaluation: reuses extraction prompt.
6. Recommendation parse prompt: user prompt -> filters.
7. Recommendation rerank prompt: shortlist -> chosen indices.

New product verdict:

- KEEP only #6, rewritten as a strict, cheap, low-token intent parser.
- DELETE all extraction, disambiguation-by-LLM, comment analysis, Reddit, candidate evaluation, and reranking calls.

## 5. KEEP / SIMPLIFY / REWRITE / DELETE feature analysis

| Feature                         | Verdict       | Why                                                       |
| ------------------------------- | ------------- | --------------------------------------------------------- |
| Personal watchlist              | KEEP/REWRITE  | This is now the product. Needs import-first architecture. |
| IMDb import                     | NEW           | Must be core onboarding.                                  |
| Home chat input                 | KEEP/SIMPLIFY | One natural-language prompt is the right interaction.     |
| Prompt chips                    | KEEP/REWRITE  | Make them rotating conversational thoughts, not filters.  |
| Multiple recommendations        | DELETE        | New product demands one answer.                           |
| More Like This                  | DELETE        | It creates another recommendation feed.                   |
| Title detail page/modal         | SIMPLIFY      | Keep only enough info to press Play/mark watched/remove.  |
| Onboarding preferences          | DELETE        | Filters/preferences are mental labor.                     |
| YouTube curator pipeline        | DELETE        | Discovery is no longer the problem.                       |
| Reddit pipeline                 | DELETE        | Discovery is no longer the problem.                       |
| Channel discovery               | DELETE        | Old product.                                              |
| IMDb ratings sync               | DELETE        | Ratings encourage evaluation instead of action.           |
| Streaming provider availability | SIMPLIFY      | Useful only as a practical “where can I watch it?” hint.  |
| AI extraction                   | DELETE        | Not needed.                                               |
| AI reranking                    | DELETE        | AI must not choose.                                       |
| AI intent parser                | KEEP/SIMPLIFY | Only job: translate casual text into intent.              |
| Recommendation traces           | KEEP/SIMPLIFY | Needed for quality/debugging.                             |
| Widget                          | NEW           | Defining surface for daily decision nudges.               |

## 6. New product architecture

### 6.1 Product model

The product is Marquee:

```text
IMDb / future provider import
  -> watchlist items
  -> TMDB metadata + title traits
  -> user asks “what kind of night is this?”
  -> AI parses intent only
  -> deterministic watchlist scorer chooses ONE title
  -> user presses Play / marks watched / asks again
```

### 6.2 New folder structure

```text
src/app/
  page.tsx                    # Home: one question, one answer
  import/page.tsx              # Guided IMDb import flow
  watchlist/page.tsx           # Search/sort/mark watched/remove/import
  settings/page.tsx            # Provider, data, reset, future account settings
  api/
    intent/route.ts            # AI intent parse only
    decide/route.ts            # Deterministic one-title decision
    imports/imdb/route.ts      # IMDb CSV upload/import
    watchlist/route.ts         # list/search/sort/remove/mark watched
    titles/search/route.ts     # future manual add
src/components/marquee/
  home-screen.tsx
  prompt-rotator.tsx
  one-pick.tsx
  imdb-import.tsx
  watchlist-table.tsx
  bottom-nav.tsx
src/lib/marquee/
  intent.ts
  decide.ts
  imdb-csv.ts
  title-match.ts
  title-traits.ts
  widget-lines.ts
  types.ts
```

Everything under `scripts/pipeline`, most `components/fx`, most `components/landing`, and old `components/dj` should be deleted or replaced.

## 7. New smallest database schema

```sql
create table users_or_devices (
  id uuid primary key default gen_random_uuid(),
  device_id text unique,
  created_at timestamptz not null default now()
);

create table import_batches (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users_or_devices(id) on delete cascade,
  provider text not null check (provider in ('imdb', 'letterboxd', 'trakt', 'generic_csv', 'manual')),
  source_filename text,
  total_rows integer not null default 0,
  matched_rows integer not null default 0,
  failed_rows integer not null default 0,
  status text not null check (status in ('processing', 'complete', 'failed')),
  created_at timestamptz not null default now()
);

create table titles (
  tmdb_id integer primary key,
  imdb_id text,
  title text not null,
  media_type text not null check (media_type in ('movie', 'tv')),
  year integer,
  runtime integer,
  genres text[] not null default '{}',
  poster_path text,
  backdrop_path text,
  streaming_providers text[] not null default '{}',
  updated_at timestamptz not null default now()
);

create table title_traits (
  tmdb_id integer primary key references titles(tmdb_id) on delete cascade,
  traits text[] not null default '{}',
  pace text,
  commitment_level text,
  mood text[] not null default '{}',
  intensity text,
  phone_friendliness text,
  updated_at timestamptz not null default now()
);

create table watchlist_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users_or_devices(id) on delete cascade,
  tmdb_id integer not null references titles(tmdb_id) on delete cascade,
  import_batch_id uuid references import_batches(id) on delete set null,
  provider text not null default 'manual',
  provider_item_id text,
  original_title text,
  watched boolean not null default false,
  watched_at timestamptz,
  added_at timestamptz not null default now(),
  unique(owner_id, tmdb_id)
);

create table recommendation_sessions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users_or_devices(id) on delete cascade,
  prompt text not null,
  parsed_intent jsonb not null default '{}'::jsonb,
  candidate_count integer not null default 0,
  chosen_tmdb_id integer references titles(tmdb_id),
  created_at timestamptz not null default now()
);

create table recommendation_feedback (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references recommendation_sessions(id) on delete cascade,
  action text not null check (action in ('played', 'not_tonight', 'mark_watched', 'remove')),
  created_at timestamptz not null default now()
);
```

No curators. No mentions. No videos. No Reddit. No extraction runs.

## 8. New API design

### `POST /api/import/imdb`

Input: CSV file. Behavior:

1. Parse IMDb watchlist CSV.
2. Deduplicate by IMDb ID/title/year.
3. Match to TMDB via IMDb ID or title/year search.
4. Upsert `titles`.
5. Generate or update `title_traits` deterministically from metadata first; optionally later via cheap AI batch classification.
6. Insert `watchlist_items`.
7. Return import summary.

### `POST /api/intent`

Input: `{ prompt }`.

Output example:

```json
{
  "mood": ["lazy"],
  "traits": ["low_effort", "phone_friendly"],
  "maxRuntime": 100,
  "mediaType": "any",
  "avoid": ["bleak", "slow_burn"]
}
```

AI cost should be tiny. Cache repeated prompt parses.

### `POST /api/decide`

Input: `{ deviceId, prompt }`.

Behavior:

1. Parse intent via `/api/intent` or shared function.
2. Load unwatched watchlist items.
3. Score deterministically against title metadata/traits.
4. Pick exactly one title.
5. Store `recommendation_sessions`.
6. Return one title and a short explanation.

No reranker. No grid. No three picks.

### `GET /api/watchlist`

Search, sort, watched filter, pagination.

### `PATCH /api/watchlist/:id`

Mark watched/unwatched.

### `DELETE /api/watchlist/:id`

Remove.

## 9. New AI flow

AI does one thing:

```text
User prompt -> structured intent JSON
```

Rules:

- Never returns titles.
- Never ranks candidates.
- Never sees the whole watchlist unless a future local model is used.
- Small model, low max tokens, aggressive schema validation.
- Deterministic regex fallback for common prompts.

## 10. New deterministic recommendation flow

1. Load user watchlist.
2. Exclude watched unless prompt says rewatch.
3. Apply hard constraints only when explicit: runtime, media type.
4. Score traits:
   - mood match
   - runtime/commitment match
   - pace match
   - avoid mismatch penalty
   - recency penalty if shown recently
   - tiny tie-breaker by added date or deterministic hash, not randomness.
5. Return exactly one title.
6. Explanation format:
   - “This is under 90 minutes, starts fast, and won’t ask much from you.”
   - “You saved this forever ago. It’s weird, short, and actually fits tonight.”

## 11. New onboarding

### Screen 1: Welcome

Headline: `Stop scrolling. Pick from your actual list.`

Primary: `Import IMDb Watchlist`

### Screen 2: IMDb guide

Primary action: `Open IMDb Watchlist`

Target URL: `https://www.imdb.com/user/ur0000000/watchlist/` cannot know the user ID, so use the closest stable IMDb watchlist page/help path available in product copy and tell the user to sign in. Implementation should open IMDb in a new tab and keep Marquee on the import screen.

Copy:

1. Open IMDb Watchlist.
2. Sign in if IMDb asks.
3. Use the list menu to export/download CSV.
4. Come back here.

Secondary action: `Import IMDb CSV` opens file picker immediately.

### Screen 3: Import progress

Show rows parsed, matched, duplicates skipped, failed matches.

### Screen 4: Done

One CTA: `What kind of night is this?`

Architecture must support providers via an `importProviders` interface:

```ts
interface ImportProvider {
  id: "imdb" | "letterboxd" | "trakt" | "generic_csv" | "manual";
  parse(file: File): Promise<ImportedTitle[]>;
  match(item: ImportedTitle): Promise<MatchedTitle | null>;
}
```

## 12. New Home screen

Only:

- headline: `What kind of night is this?`
- input: natural language.
- rotating prompt chips, about 15 visible/rotating options.
- one result.

Prompt examples:

- `Everything looks like shit.`
- `Don't make me think.`
- `I got like 90 minutes.`
- `Something that gets good immediately.`
- `I'm probably gonna be on my phone.`
- `I don't even know why I opened Netflix.`
- `Make me forget my phone exists.`
- `Not a whole fucking commitment.`
- `Surprise me.`
- `Something cozy but not dumb.`
- `Dark, but don't ruin my night.`
- `I want to feel like I made a good decision.`
- `One episode and I'm out.`
- `Something weird, but not homework.`
- `I have no personality tonight.`

## 13. New Watchlist screen

Only supports:

- Search.
- Sort: recently added, title, runtime, unwatched first.
- Mark watched.
- Remove.
- Import.

No ratings, reviews, social, feeds, or rows.

## 14. New Settings screen

Only:

- Import another list.
- Export/delete data.
- Default streaming services, if retained.
- About/privacy.

## 15. Widget design

Large iPhone Home Screen widget concept:

- Displays one rotating WTForecast-inspired line every few hours.
- Opens directly to Home with input focused / recommendation flow ready.
- No dashboard.

Widget lines:

- `Everything looks like shit tonight.`
- `Stop opening Netflix. I already picked something.`
- `You saved this three years ago. WTF are you waiting for?`
- `You've spent longer choosing than this movie is.`
- `You have 287 things saved and somehow nothing looks good.`
- `Tap here before you rewatch The Office again.`

Native widget requires an iOS wrapper or PWA/widget strategy later. For web MVP, design and copy should be prepared but not block shipping.

## 16. Complete migration plan

### Phase 1: Freeze and cut scope

- Stop adding to YouTube/Reddit pipeline.
- Hide/delete How It Works old curator page.
- Remove onboarding preferences from user flow.
- Change `/api/recommend` contract to return one result.

### Phase 2: IMDb import MVP

- Add import screen.
- Add provider interface.
- Implement IMDb CSV parser.
- Match IMDb rows to TMDB.
- Populate `watchlist_items`, `titles`, and `title_traits`.

### Phase 3: Deterministic decider

- Create `src/lib/marquee/intent.ts` and `decide.ts`.
- Move regex prompt handling out of route.
- Keep Claude only for intent parse.
- Delete LLM rerank.
- Return exactly one title.

### Phase 4: Minimal UX rebuild

- Home: one question, chips, one answer.
- Watchlist: search/sort/mark watched/remove/import.
- Settings: import/data/privacy.
- Remove detail modal's “More Like This.”

### Phase 5: Schema cleanup

- Add new minimal tables.
- Backfill current `viewer_watchlist` into `watchlist_items`.
- Keep old tables temporarily in production but remove code paths.
- Drop old tables after export/backup and verification.

### Phase 6: Delete old code

Delete:

- `scripts/pipeline/*` except any TMDB matching utility rewritten under `src/lib/marquee`.
- `.github/workflows/daily-pipeline.yml` and `weekly-discovery.yml`.
- `src/lib/pipeline/youtube.ts`, `reddit.ts`, `transcript.ts`.
- `config/curators.ts`, `subreddits.ts`, `discovery-queries.ts`.
- Old landing/effects/journey/punk components not used by the app.

### Phase 7: Widget strategy

- Ship web app first.
- Design native/PWA widget integration after the core loop is excellent.

## 17. Definition of done for the pivot

The pivot is done when:

1. A new user can open Marquee, tap `Open IMDb Watchlist`, return, import CSV, and land on Home.
2. Home asks one question and returns exactly one title from that user's watchlist.
3. The user can mark watched/remove/import from My Watchlist.
4. There are no curator feeds, no YouTube pipeline, no Reddit pipeline, no More Like This, no grids, and no three-pick recommendations in the product UI.
5. AI only parses intent.
6. The codebase is smaller, not bigger.

## 18. Final recommendation

Do not keep iterating on the current recommendation pipeline. It is solving the old problem.

The next implementation PR should be:

`Rewrite recommendation route to return exactly one watchlist title and remove LLM reranking.`

The PR after that should be:

`Add guided IMDb CSV import onboarding.`

Only after those two are working should the old YouTube/Reddit/pipeline code be deleted in a large cleanup PR.
