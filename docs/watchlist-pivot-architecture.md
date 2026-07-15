# Marquee Watchlist Pivot Architecture Review

## Executive verdict

The current app is not yet the product described in the pivot. It is a curator/YouTube evidence recommendation system with a thin device watchlist layered on top. The new product should be much smaller: import a user's watchlist, understand a casual mood prompt, deterministically pick exactly one saved title, and help the user press Play.

The correct strategic move is to delete or quarantine most of the ingestion/recommendation platform and rebuild around a personal watchlist decision engine.

## 1. Current architecture documentation

### Screens

| Screen            | Current file                                                                | What exists                                                                                                   | Verdict                                                    |
| ----------------- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Home / Watch DJ   | `src/app/page.tsx`, `src/components/dj/watch-dj.tsx`                        | Single conversational recommendation screen, still backed by curator evidence and save-to-watchlist behavior. | **REWRITE** into one-answer watchlist decision screen.     |
| Title detail      | `src/components/dj/title-detail.tsx`, `src/app/api/title/[tmdbId]/route.ts` | Full detail page with trailer, metadata, streaming providers, explanation, and More Like This.                | **DELETE** for pivot v1. It creates more browsing.         |
| How it works      | `src/app/how-it-works/page.tsx`                                             | Explains curator-driven recommendation intelligence.                                                          | **DELETE** or rewrite later. It describes the old product. |
| Onboarding        | `src/components/dj/onboarding.tsx`                                          | Preference/genre/service onboarding, no longer mounted.                                                       | **DELETE** and replace with IMDb import onboarding.        |
| Error / not found | `src/app/error.tsx`, `src/app/not-found.tsx`                                | Standard app error screens.                                                                                   | **KEEP** but simplify copy.                                |

### Component groups

| Component group                                                                 | Current role                                     | Verdict                                                               |
| ------------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------- |
| `src/components/dj/*`                                                           | Active app experience.                           | **REWRITE** around Home, Import, Watchlist, Settings.                 |
| `src/components/fx/*`                                                           | Large animation/effects library.                 | **DELETE** for v1 unless one tiny grain/background component remains. |
| `src/components/landing/*`, `src/components/journey/*`, `src/components/punk/*` | Unused marketing/experimental component systems. | **DELETE**.                                                           |
| `src/components/ui/*`                                                           | Broad shadcn/Radix UI kit.                       | **SIMPLIFY** to only button, input, dialog/sheet if needed.           |

### Routes and APIs

| Route/API                 | Current behavior                                                                                                                                               | Verdict                                                            |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `/`                       | Fetches popular backdrops from `titles`, renders Watch DJ.                                                                                                     | **REWRITE**; no backdrop query, no poster-wall feel.               |
| `/how-it-works`           | Old curator-product explainer.                                                                                                                                 | **DELETE**.                                                        |
| `POST /api/recommend`     | AI parses prompt, deterministic enrichments, queries `title_signal_summary`/raw mentions, optionally constrained by `viewer_watchlist`, returns up to 3 picks. | **REWRITE** to return exactly one watchlist item.                  |
| `GET /api/title/[tmdbId]` | Details + More Like This.                                                                                                                                      | **DELETE** or reduce to metadata-only if needed.                   |
| `/api/watchlist`          | Device-scoped save/list/remove by TMDB ID.                                                                                                                     | **REWRITE** to support import state, search, sort, watched/remove. |
| `/api/preferences`        | Saves streaming/genre preferences.                                                                                                                             | **DELETE** for v1. Users do not want setup filters.                |

### Services/utilities

| Utility/service                                                     | Current role                       | Verdict                                                                       |
| ------------------------------------------------------------------- | ---------------------------------- | ----------------------------------------------------------------------------- |
| `src/lib/pipeline/supabase.ts`                                      | Supabase service-role client.      | **KEEP** server-side.                                                         |
| `src/lib/pipeline/tmdb.ts`                                          | TMDB search/details/providers.     | **SIMPLIFY** to title matching + metadata enrichment for imported watchlists. |
| `src/lib/pipeline/llm.ts`                                           | Claude JSON helper.                | **SIMPLIFY** to intent parsing only.                                          |
| `src/lib/pipeline/youtube.ts`, `transcript.ts`, `reddit.ts`         | Ingestion sources for old product. | **DELETE/ARCHIVE** from production path.                                      |
| `src/lib/device-id.ts`                                              | Anonymous local device ID.         | **KEEP** until auth exists.                                                   |
| `src/lib/motion.ts`, `src/lib/utils.ts`, `src/hooks/use-mobile.tsx` | UI helpers.                        | **KEEP only if used** after rewrite.                                          |

## 2. Complete current application data flow

### Current user flow

1. User lands on `/`.
2. Server loads backdrop paths from `titles`.
3. `AppShell` renders `WatchDj`.
4. Client loads device watchlist IDs from `/api/watchlist`.
5. User types a prompt or taps a chip.
6. Client posts prompt, device ID, shown IDs, and previous filters to `/api/recommend`.
7. API optionally loads `viewer_preferences`.
8. API calls Claude to parse prompt into media type, descriptors, runtime, genres, and reference title.
9. API applies deterministic keyword enrichments.
10. API loads `viewer_watchlist`; if non-empty, candidates are restricted to saved TMDB IDs.
11. API queries `title_signal_summary`; if unavailable/empty, falls back to raw YouTube-backed `mentions`.
12. API scores candidates and may call Claude to rerank a shortlist.
13. API returns multiple picks.
14. UI displays cards with Details, Save, and Not for me.
15. Details route opens a metadata page and shows More Like This.

### Current background data flow

1. Configured curators are ingested from YouTube.
2. Videos are stored.
3. Transcripts are fetched.
4. Claude extracts mentions.
5. TMDB resolves extracted titles.
6. Titles are enriched with metadata, ratings, artwork, providers.
7. Mentions refresh `title_signal_summary`.
8. Recommendation serving reads the evidence summary.

This entire background flow is mostly obsolete for the pivot.

## 3. Existing database schema

### Tables currently defined

| Table                   | Purpose                                      | Pivot verdict                                                     |
| ----------------------- | -------------------------------------------- | ----------------------------------------------------------------- |
| `curators`              | YouTube curator source channels.             | **DELETE/ARCHIVE**.                                               |
| `videos`                | YouTube videos.                              | **DELETE/ARCHIVE**.                                               |
| `mentions`              | Extracted title evidence from videos/Reddit. | **DELETE/ARCHIVE** for v1.                                        |
| `titles`                | TMDB title metadata cache.                   | **KEEP/SIMPLIFY**.                                                |
| `pipeline_runs`         | Pipeline run metrics.                        | **DELETE** for v1.                                                |
| `reddit_threads`        | Dormant Reddit source ingestion.             | **DELETE**.                                                       |
| `candidate_channels`    | YouTube channel discovery.                   | **DELETE**.                                                       |
| `viewer_preferences`    | Genre/service onboarding preferences.        | **DELETE**.                                                       |
| `title_signal_summary`  | Aggregated curator evidence.                 | **DELETE** for pivot v1. Maybe archive as `legacy_title_signals`. |
| `extraction_runs`       | LLM extraction provenance.                   | **DELETE**.                                                       |
| `recommendation_traces` | Recommendation debug traces.                 | **REWRITE** as lightweight decision sessions.                     |
| `viewer_watchlist`      | Device-scoped saved titles.                  | **REWRITE** into provider-aware watchlists/items.                 |

## 4. Existing API documentation

| API                       | Inputs                                                                | Output                                          | Current issue                                                                 |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------- |
| `POST /api/recommend`     | Prompt, deviceId, excludeIds, previousFilters, optional genres/debug. | Up to 3 recommendations + filters/trace.        | New product requires one answer from watchlist, not multiple recommendations. |
| `GET /api/title/[tmdbId]` | TMDB ID + type.                                                       | Metadata, trailer, explanation, More Like This. | Encourages browsing and rabbit holes.                                         |
| `GET /api/watchlist`      | deviceId query param.                                                 | Saved items.                                    | Too shallow: no import, watched, sort, provider source, match status.         |
| `POST /api/watchlist`     | deviceId, tmdbId, source.                                             | Save item.                                      | No manual search/import flow.                                                 |
| `DELETE /api/watchlist`   | deviceId, tmdbId.                                                     | Remove item.                                    | OK primitive.                                                                 |
| `/api/preferences`        | Device preferences.                                                   | Preferences.                                    | Not aligned with no-filters pivot.                                            |

## 5. Existing recommendation pipeline

Current serving logic is:

1. Claude parse prompt.
2. Local keyword enrichment.
3. Optional reference-title expansion.
4. Load watchlist IDs.
5. Query `title_signal_summary` or raw mentions.
6. Filter by media/runtime/genres/descriptors/services.
7. Score by evidence, sentiment, source count, descriptor hits, ratings, preferences.
8. Claude reranks shortlist.
9. Return multiple picks.

Pivot issue: this is still a recommendation engine. The new flow should be a deterministic watchlist decision engine that returns exactly one saved title.

## 6. Existing prompts and AI calls

| AI call                      | Location                                         | Purpose                                  | Pivot verdict                                                                               |
| ---------------------------- | ------------------------------------------------ | ---------------------------------------- | ------------------------------------------------------------------------------------------- |
| Recommendation parse prompt  | `src/app/api/recommend/route.ts`                 | Parse natural language into filters.     | **KEEP/SIMPLIFY** as the only AI call.                                                      |
| Recommendation rerank prompt | `src/app/api/recommend/route.ts`                 | Pick 3 from shortlist.                   | **DELETE**. Deterministic logic should pick one.                                            |
| YouTube extraction prompt    | `scripts/pipeline/02-extract-mentions.ts`        | Extract title mentions from transcripts. | **DELETE/ARCHIVE**.                                                                         |
| TMDB disambiguation prompt   | `scripts/pipeline/03-resolve-tmdb.ts`            | Resolve ambiguous mentions.              | **DELETE/ARCHIVE** for old pipeline; import matching should use deterministic search first. |
| Comment analysis prompt      | `scripts/pipeline/04-analyze-comments.ts`        | Summarize YouTube comments.              | **DELETE**.                                                                                 |
| Reddit extraction prompt     | `scripts/pipeline/06-extract-reddit-mentions.ts` | Extract mentions from Reddit.            | **DELETE**.                                                                                 |
| Candidate evaluation prompt  | `scripts/pipeline/08-evaluate-candidates.ts`     | Check YouTube source quality.            | **DELETE**.                                                                                 |

## 7. Existing background jobs

| Job                                     | Current script/workflow                  | Verdict                                                         |
| --------------------------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| Daily YouTube pipeline                  | `.github/workflows/daily-pipeline.yml`   | **DELETE** for pivot.                                           |
| Weekly discovery                        | `.github/workflows/weekly-discovery.yml` | **DELETE**.                                                     |
| YouTube ingest/extract/resolve/comments | `scripts/pipeline/01-04*`                | **DELETE/ARCHIVE**.                                             |
| Reddit ingest/extract                   | `scripts/pipeline/05-06*`                | **DELETE**.                                                     |
| Discovery/evaluation                    | `scripts/pipeline/07-08*`                | **DELETE**.                                                     |
| Ratings sync                            | `scripts/pipeline/ratings-sync.ts`       | **SIMPLIFY**; use TMDB metadata on import, skip IMDb bulk sync. |
| Audit/report                            | `audit-youtube-bank.ts`, `report.ts`     | **DELETE**.                                                     |

## 8. Existing dependencies

### Keep

- `next`, `react`, `react-dom`, `typescript`, `eslint`, `prettier`, `tailwindcss`.
- `@supabase/supabase-js`.
- `@anthropic-ai/sdk`, but only for intent parsing.
- `zod` for import/API validation.
- `lucide-react` for tiny icons.

### Delete or avoid in v1 rewrite

- YouTube transcript/source dependencies: `youtube-transcript`.
- Heavy animation/display stack: `three`, `gsap`, `framer-motion`, `lenis`, most FX components.
- Unused UI dependencies after component deletion: many Radix packages, carousel, chart, date picker, resizable panels, etc.

## 9. KEEP / SIMPLIFY / REWRITE / DELETE by major feature

| Feature                            | Decision                 | Why                                                                        |
| ---------------------------------- | ------------------------ | -------------------------------------------------------------------------- |
| Personal watchlist                 | **REWRITE**              | It must become the product, not a bolt-on.                                 |
| IMDb import onboarding             | **BUILD**                | Required by pivot.                                                         |
| Mood prompt home                   | **REWRITE**              | Keep one input and one result only.                                        |
| AI intent parsing                  | **SIMPLIFY**             | One cheap structured parser, no AI ranking.                                |
| Deterministic scoring              | **REWRITE**              | Should rank watchlist items by imported metadata/traits and prompt intent. |
| YouTube curator ingestion          | **DELETE/ARCHIVE**       | No longer core.                                                            |
| Reddit pipeline                    | **DELETE**               | Explicitly not the product.                                                |
| Title detail / More Like This      | **DELETE**               | Violates one-answer principle.                                             |
| Preferences onboarding             | **DELETE**               | Users do not want filters/setup.                                           |
| How it works page                  | **DELETE/REWRITE LATER** | Old product story.                                                         |
| Background poster/carousel visuals | **DELETE**               | Decision fatigue and visual clutter.                                       |
| Watchlist management               | **BUILD**                | Search, sort, mark watched, remove, import only.                           |
| Widget                             | **DESIGN/BUILD**         | Strategic product surface.                                                 |

## 10. New architecture

```text
IMDb CSV / future provider import
  -> provider adapter
  -> normalized imported rows
  -> TMDB match/enrichment
  -> titles
  -> watchlists / watchlist_items

User mood prompt
  -> AI intent parser (structured JSON only)
  -> deterministic watchlist scorer
  -> exactly one title
  -> one short explanation
  -> feedback event
```

The product has three surfaces:

1. Home: ask what kind of night this is; receive one title.
2. My Watchlist: search/sort/mark watched/remove/import.
3. Settings: import provider management and basic data controls.

## 11. New folder structure

```text
src/app/
  page.tsx
  watchlist/page.tsx
  settings/page.tsx
  api/
    decide/route.ts
    imports/imdb/route.ts
    watchlist/route.ts
    watchlist/[itemId]/route.ts
    titles/search/route.ts
src/components/marquee/
  home-screen.tsx
  prompt-rail.tsx
  one-pick.tsx
  imdb-import.tsx
  watchlist-table.tsx
  bottom-nav.tsx
src/lib/marquee/
  intent.ts
  scoring.ts
  explanations.ts
  imdb-csv.ts
  providers.ts
  tmdb-match.ts
  widget-copy.ts
```

Everything under `scripts/pipeline`, `config/curators.ts`, `config/subreddits.ts`, and old FX/landing/punk/journey components should be removed from the production app.

## 12. New database schema

Smallest viable schema:

```sql
users_or_devices (
  id text primary key,
  created_at timestamptz
)

titles (
  tmdb_id integer primary key,
  imdb_id text unique,
  title text not null,
  original_title text,
  media_type text not null,
  year integer,
  runtime integer,
  genres text[] not null default '{}',
  overview text,
  poster_path text,
  backdrop_path text,
  streaming_providers text[] not null default '{}',
  updated_at timestamptz not null default now()
)

title_traits (
  tmdb_id integer primary key references titles(tmdb_id),
  traits text[] not null default '{}',
  source text not null default 'metadata',
  updated_at timestamptz not null default now()
)

watchlists (
  id uuid primary key,
  device_id text not null,
  provider text not null default 'manual',
  name text not null default 'My Watchlist',
  created_at timestamptz not null default now()
)

watchlist_items (
  id uuid primary key,
  watchlist_id uuid references watchlists(id) on delete cascade,
  tmdb_id integer references titles(tmdb_id),
  provider_item_id text,
  imported_title text not null,
  imported_year integer,
  media_type text,
  status text not null default 'unwatched',
  match_status text not null default 'matched',
  sort_title text,
  added_at timestamptz,
  created_at timestamptz not null default now(),
  unique(watchlist_id, tmdb_id)
)

recommendation_sessions (
  id uuid primary key,
  device_id text not null,
  prompt text not null,
  parsed_intent jsonb not null,
  chosen_item_id uuid references watchlist_items(id),
  candidate_count integer not null,
  explanation text,
  created_at timestamptz not null default now()
)

recommendation_feedback (
  id uuid primary key,
  session_id uuid references recommendation_sessions(id) on delete cascade,
  feedback text not null check (feedback in ('played', 'skipped', 'not_tonight', 'already_watched')),
  created_at timestamptz not null default now()
)
```

## 13. New API design

| API                                  | Purpose                                                                              |
| ------------------------------------ | ------------------------------------------------------------------------------------ |
| `POST /api/imports/imdb`             | Accept IMDb CSV upload, parse, dedupe, match to TMDB, create/update watchlist items. |
| `GET /api/imports/imdb/instructions` | Return IMDb export URL/instructions for onboarding UI.                               |
| `POST /api/decide`                   | Parse mood intent and deterministically return exactly one watchlist item.           |
| `GET /api/watchlist`                 | Search/sort watchlist items.                                                         |
| `PATCH /api/watchlist/[itemId]`      | Mark watched/unwatched.                                                              |
| `DELETE /api/watchlist/[itemId]`     | Remove from watchlist.                                                               |
| `GET /api/titles/search`             | Manual addition search.                                                              |
| `POST /api/feedback`                 | Record played/skipped/not tonight.                                                   |

## 14. New AI flow

The AI does exactly one thing:

```json
{
  "mood": ["lazy", "cozy", "mind_bending"],
  "constraints": {
    "max_runtime_minutes": 120,
    "media_type": "movie",
    "avoid": ["bleak", "slow"]
  },
  "energy": "low" | "medium" | "high",
  "commitment": "tiny" | "normal" | "big",
  "explanation_tone": "plain"
}
```

No AI title generation. No AI shortlist ranking. No hallucinated movies. No long prose.

## 15. New recommendation flow

1. User prompt: “I got like 90 minutes.”
2. AI converts to structured intent: max runtime 95, commitment tiny, energy low.
3. Load unwatched watchlist items.
4. Deterministic filters: runtime, media type, watched status.
5. Deterministic score: exact constraints, traits, runtime fit, recency in list, randomness only as stable tie-breaker.
6. Return exactly one title.
7. Explanation: “It’s short, starts fast, and won’t turn tonight into homework.”

## 16. New onboarding

Flow:

1. Welcome: “Marquee helps you pick from your own watchlist.”
2. Primary button: **Open IMDb Watchlist**.
3. Explain: export/download your IMDb Watchlist CSV.
4. Return screen stays on import step.
5. Secondary/next button: **Import IMDb CSV** opens file picker.
6. App parses, dedupes, matches to TMDB, enriches metadata, and reports imported/matched/unmatched counts.
7. Done -> Home.

Architecture must use provider adapters:

```ts
interface WatchlistImportProvider {
  id: "imdb" | "letterboxd" | "trakt" | "generic_csv";
  displayName: string;
  exportUrl?: string;
  parse(file: File): Promise<ImportedWatchlistRow[]>;
}
```

## 17. New Home screen

Only:

- Headline: “What kind of night is this?”
- Text input.
- Rotating prompt chips, around 15 visible/rotating from a larger bank.
- One recommendation card after submit.

No details modal, no feed, no rows, no More Like This.

## 18. New Watchlist

Only:

- Search.
- Sort: recently added, title, runtime, unwatched first.
- Mark watched.
- Remove.
- Import.

No reviews, ratings, social, comments, recommendations, or detail rabbit holes.

## 19. New Widget

Large iPhone Home Screen widget concept:

- Shows one sarcastic observation about decision paralysis.
- Refreshes every few hours.
- Tap opens Home directly with a prefilled/implicit “decide for me” session.

Example copy bank:

- “Everything looks like shit tonight.”
- “Stop opening Netflix. I already picked something.”
- “You saved this three years ago. WTF are you waiting for?”
- “You’ve spent longer choosing than this movie is.”
- “You have 287 movies saved and somehow none of them look good.”

Implementation note: the web app can define widget copy and deep-link behavior, but the actual iOS widget requires a native iOS target or a companion native wrapper.

## 20. Complete migration plan

### Phase 1 — Stop adding to old system

- Freeze YouTube/Reddit/discovery work.
- Do not expand curator evidence.
- Keep current app running while building pivot behind new routes/components.

### Phase 2 — Build importer and minimal schema

- Add `watchlists`, `watchlist_items`, `title_traits`, `recommendation_sessions`, `recommendation_feedback`.
- Build IMDb CSV parser and TMDB matcher.
- Keep `titles` but remove dependency on curator evidence.

### Phase 3 — Build one-answer decision engine

- Create `POST /api/decide`.
- Move current prompt parsing into `src/lib/marquee/intent.ts`.
- Remove reranking AI.
- Return exactly one watchlist item.

### Phase 4 — Replace UI

- Replace Watch DJ with Marquee Home.
- Add IMDb import onboarding.
- Add My Watchlist and Settings nav only.
- Delete Title Detail and More Like This.

### Phase 5 — Delete old platform code

Delete or archive:

- YouTube pipeline scripts.
- Reddit scripts and clients.
- discovery workflows.
- curator config.
- old landing/FX/punk/journey component systems.
- `how-it-works` old copy.
- `viewer_preferences` flow.

### Phase 6 — Widget

- Define widget copy bank and deep-link route.
- If native app/wrapper exists, implement iOS widget.
- If web-only, prepare PWA metadata and native handoff plan.

## Final target

Marquee should not feel like a recommendation engine. It should feel like texting the least annoying friend you have:

> “What kind of night is this?”

Then it picks one thing from your own list and gets out of the way.
