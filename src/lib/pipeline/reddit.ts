import { env } from "./env";

const USER_AGENT = "curator-pipeline/1.0 (personal recommendation research script)";
const MAX_ATTEMPTS = 5;
const MIN_INTERVAL_MS = 650; // keeps us safely under Reddit's 100 req/min OAuth limit

let lastRequestAt = 0;
let cachedToken: { value: string; expiresAt: number } | null = null;

function requireRedditCredentials(): { clientId: string; clientSecret: string } {
  if (!env.REDDIT_CLIENT_ID || !env.REDDIT_CLIENT_SECRET) {
    throw new Error(
      "REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET are required for Reddit ingestion. Add them to .env.",
    );
  }
  return { clientId: env.REDDIT_CLIENT_ID, clientSecret: env.REDDIT_CLIENT_SECRET };
}

async function throttle(): Promise<void> {
  const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestAt = Date.now();
}

/** App-only (client_credentials) OAuth token — read-only access, no user login needed. */
async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) return cachedToken.value;

  const { clientId, clientSecret } = requireRedditCredentials();
  await throttle();
  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) throw new Error(`Reddit OAuth failed: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { value: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return cachedToken.value;
}

async function redditFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const token = await getAccessToken();
  const url = new URL(`https://oauth.reddit.com${path}`);
  url.searchParams.set("raw_json", "1");
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  for (let attempt = 0; ; attempt++) {
    await throttle();
    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}`, "User-Agent": USER_AGENT },
    });
    if (res.ok) return (await res.json()) as T;
    if ((res.status === 429 || res.status >= 500) && attempt < MAX_ATTEMPTS - 1) {
      await new Promise((r) => setTimeout(r, 2 ** attempt * 1000));
      continue;
    }
    throw new Error(`Reddit API ${res.status} on ${path}: ${await res.text()}`);
  }
}

export interface RawRedditThread {
  redditThreadId: string;
  title: string;
  permalink: string;
  score: number;
  numComments: number;
}

interface RedditPostData {
  id: string;
  title: string;
  permalink: string;
  score: number;
  num_comments: number;
  selftext?: string;
}

interface RedditListing {
  data: { children: { data: RedditPostData }[] };
}

function toThread(p: RedditPostData): RawRedditThread {
  return {
    redditThreadId: p.id,
    title: p.title,
    permalink: `https://reddit.com${p.permalink}`,
    score: p.score,
    numComments: p.num_comments,
  };
}

/** Top threads of the past year for a subreddit. */
export async function listTopThreads(subreddit: string, limit = 100): Promise<RawRedditThread[]> {
  const data = await redditFetch<RedditListing>(`/r/${subreddit}/top`, {
    t: "year",
    limit: String(limit),
  });
  return data.data.children.map((c) => toThread(c.data));
}

/** Currently-hot threads for a subreddit — meant to be run weekly. */
export async function listHotThreads(subreddit: string, limit = 100): Promise<RawRedditThread[]> {
  const data = await redditFetch<RedditListing>(`/r/${subreddit}/hot`, { limit: String(limit) });
  return data.data.children.map((c) => toThread(c.data));
}

export interface RawRedditComment {
  body: string;
  score: number;
}

export interface RedditThreadDetail {
  selftext: string;
  comments: RawRedditComment[];
}

interface RedditCommentData {
  body?: string;
  score?: number;
}

interface RedditCommentListing {
  data: { children: { kind: string; data: RedditCommentData }[] };
}

/**
 * Fetches a thread's full body and its top-level comments, filtered to those
 * at or above minScore. Called at extraction time only — never persisted, same
 * principle as YouTube transcripts.
 */
export async function getThreadDetail(
  subreddit: string,
  threadId: string,
  minScore: number,
): Promise<RedditThreadDetail> {
  const [postListing, commentListing] = await redditFetch<[RedditListing, RedditCommentListing]>(
    `/r/${subreddit}/comments/${threadId}`,
    { limit: "200", depth: "1" },
  );

  const selftext = postListing.data.children[0]?.data.selftext ?? "";

  const comments: RawRedditComment[] = commentListing.data.children
    .filter((c) => c.kind === "t1" && typeof c.data.body === "string")
    .map((c) => ({ body: c.data.body as string, score: c.data.score ?? 0 }))
    .filter((c) => c.score >= minScore);

  return { selftext, comments };
}
