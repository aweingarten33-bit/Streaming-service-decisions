export type MediaType = "movie" | "tv" | "documentary" | "unknown";
export type ResolvedMediaType = "movie" | "tv";
export type Sentiment =
  "enthusiastic_rec" | "qualified_rec" | "notable_mention" | "pan" | "neutral_reference";
export type ResolutionConfidence = "exact" | "disambiguated" | "unresolved";
export type TranscriptStatus = "pending" | "available" | "unavailable";

export interface CuratorConfig {
  name: string;
  youtubeHandle: string;
  url: string;
  active: boolean;
}

export interface Curator extends CuratorConfig {
  id: string;
  youtubeChannelId: string;
}

export interface RawVideo {
  youtubeVideoId: string;
  title: string;
  publishedAt: string;
  description: string;
  viewCount?: number;
}

export interface VideoRecord {
  id: string;
  curatorId: string;
  youtubeVideoId: string;
  title: string;
  publishedAt: string;
  description: string | null;
  transcriptStatus: TranscriptStatus;
  extractedAt: string | null;
}

/** Shape the LLM must return for each mention it extracts from a transcript. */
export interface MentionExtraction {
  title_mentioned: string;
  media_type: MediaType;
  year_hint: number | null;
  context_clues: string;
  sentiment: Sentiment;
  descriptors: string[];
  quote_free_summary: string;
}

export interface MentionRecord extends MentionExtraction {
  id: string;
  videoId: string;
  tmdbId: number | null;
  resolutionConfidence: ResolutionConfidence | null;
  sourceUrl: string;
}

export interface TitleRecord {
  tmdbId: number;
  title: string;
  mediaType: ResolvedMediaType;
  year: number | null;
  genres: string[];
  runtime: number | null;
  posterPath: string | null;
}

export interface PipelineRun {
  id: string;
  runAt: string;
  videosProcessed: number;
  mentionsExtracted: number;
  tokensUsed: number;
  costEstimate: number;
}
