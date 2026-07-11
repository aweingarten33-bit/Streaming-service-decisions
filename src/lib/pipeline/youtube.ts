import { env } from "./env";
import type { RawVideo } from "./types";

const BASE = "https://www.googleapis.com/youtube/v3";
const MAX_ATTEMPTS = 5;

async function ytFetch<T>(path: string, params: Record<string, string>): Promise<T> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("key", env.YOUTUBE_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url.toString());
    if (res.ok) return (await res.json()) as T;
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      continue;
    }
    throw new Error(`YouTube API ${res.status} on ${path}: ${await res.text()}`);
  }
}

/** Resolves a @handle to a stable channel ID via the Data API (never hardcode channel IDs). */
export async function resolveChannelId(handle: string): Promise<string> {
  const forHandle = handle.startsWith("@") ? handle : `@${handle}`;
  const data = await ytFetch<{ items?: { id: string }[] }>("/channels", {
    part: "id",
    forHandle,
  });
  const id = data.items?.[0]?.id;
  if (!id) throw new Error(`Could not resolve YouTube channel for handle ${forHandle}`);
  return id;
}

async function getUploadsPlaylistId(channelId: string): Promise<string> {
  const data = await ytFetch<{
    items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[];
  }>("/channels", { part: "contentDetails", id: channelId });
  const playlistId = data.items?.[0]?.contentDetails.relatedPlaylists.uploads;
  if (!playlistId) throw new Error(`No uploads playlist found for channel ${channelId}`);
  return playlistId;
}

async function ytFetchAllowDisabled<T>(
  path: string,
  params: Record<string, string>,
): Promise<T | null> {
  const url = new URL(`${BASE}${path}`);
  url.searchParams.set("key", env.YOUTUBE_API_KEY);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; ; attempt++) {
    const res = await fetch(url.toString());
    if (res.ok) return (await res.json()) as T;
    if (res.status === 403) return null; // comments disabled on this video
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      continue;
    }
    throw new Error(`YouTube API ${res.status} on ${path}: ${await res.text()}`);
  }
}

export interface RawComment {
  text: string;
  likeCount: number;
}

/** Fetches top-level comments ordered by relevance. Returns [] if comments are disabled for the video. */
export async function listTopComments(videoId: string, maxResults = 50): Promise<RawComment[]> {
  const data = await ytFetchAllowDisabled<{
    items?: {
      snippet: { topLevelComment: { snippet: { textOriginal: string; likeCount: number } } };
    }[];
  }>("/commentThreads", {
    part: "snippet",
    videoId,
    order: "relevance",
    maxResults: String(maxResults),
    textFormat: "plainText",
  });
  if (!data) return [];
  return (data.items ?? []).map((item) => ({
    text: item.snippet.topLevelComment.snippet.textOriginal,
    likeCount: item.snippet.topLevelComment.snippet.likeCount,
  }));
}

export interface ChannelSearchResult {
  channelId: string;
}

/** Searches for channels matching a query — used by the discovery engine to find new candidates. */
export async function searchChannels(
  query: string,
  maxResults = 25,
): Promise<ChannelSearchResult[]> {
  const data = await ytFetch<{ items?: { snippet: { channelId: string } }[] }>("/search", {
    part: "snippet",
    type: "channel",
    q: query,
    maxResults: String(maxResults),
  });
  return (data.items ?? []).map((i) => ({ channelId: i.snippet.channelId }));
}

export interface ChannelStats {
  title: string;
  subscriberCount: number;
}

/** Basic channel stats for the discovery engine's quality gates. Returns null if the channel doesn't exist. */
export async function getChannelStats(channelId: string): Promise<ChannelStats | null> {
  const data = await ytFetch<{
    items?: { snippet: { title: string }; statistics: { subscriberCount?: string } }[];
  }>("/channels", { part: "snippet,statistics", id: channelId });
  const item = data.items?.[0];
  if (!item) return null;
  return {
    title: item.snippet.title,
    subscriberCount: Number(item.statistics.subscriberCount ?? 0),
  };
}

/** Fetches view counts for a batch of videos (YouTube caps `id` at 50 per call). */
async function getVideoViewCounts(videoIds: string[]): Promise<Map<string, number>> {
  const counts = new Map<string, number>();
  if (videoIds.length === 0) return counts;
  const data = await ytFetch<{ items?: { id: string; statistics: { viewCount?: string } }[] }>(
    "/videos",
    { part: "statistics", id: videoIds.join(",") },
  );
  for (const item of data.items ?? []) {
    counts.set(item.id, Number(item.statistics.viewCount ?? 0));
  }
  return counts;
}

/** Lists only the N most recent uploads (single page, no pagination) — for cheap sampling during evaluation. */
export async function listRecentVideos(channelId: string, limit = 3): Promise<RawVideo[]> {
  const playlistId = await getUploadsPlaylistId(channelId);
  const data = await ytFetch<{
    items?: {
      contentDetails: { videoId: string; videoPublishedAt: string };
      snippet: { title: string; description: string };
    }[];
  }>("/playlistItems", { part: "contentDetails,snippet", playlistId, maxResults: String(limit) });
  const videos = (data.items ?? []).map((item) => ({
    youtubeVideoId: item.contentDetails.videoId,
    title: item.snippet.title,
    publishedAt: item.contentDetails.videoPublishedAt,
    description: item.snippet.description,
  }));

  const viewCounts = await getVideoViewCounts(videos.map((v) => v.youtubeVideoId));
  return videos.map((v) => ({ ...v, viewCount: viewCounts.get(v.youtubeVideoId) ?? 0 }));
}

/** Lists every video on a channel's uploads playlist, paginating to the end. */
export async function listUploadedVideos(channelId: string): Promise<RawVideo[]> {
  const playlistId = await getUploadsPlaylistId(channelId);
  const videos: RawVideo[] = [];
  let pageToken: string | undefined;

  do {
    const data = await ytFetch<{
      items?: {
        contentDetails: { videoId: string; videoPublishedAt: string };
        snippet: { title: string; description: string };
      }[];
      nextPageToken?: string;
    }>("/playlistItems", {
      part: "contentDetails,snippet",
      playlistId,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of data.items ?? []) {
      videos.push({
        youtubeVideoId: item.contentDetails.videoId,
        title: item.snippet.title,
        publishedAt: item.contentDetails.videoPublishedAt,
        description: item.snippet.description,
      });
    }
    pageToken = data.nextPageToken;
  } while (pageToken);

  return videos;
}
