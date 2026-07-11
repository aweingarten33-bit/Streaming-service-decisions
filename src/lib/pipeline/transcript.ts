import { YoutubeTranscript } from "youtube-transcript";

// Rough heuristic (~4 chars/token) — good enough for chunk sizing, not billing.
const CHARS_PER_CHUNK = 32_000; // ~8k tokens
const OVERLAP_CHARS = 2_000;

/**
 * Fetches a video's transcript. Returns null (never throws) when captions
 * aren't available so callers can mark the video 'unavailable' and move on.
 * Isolated behind this module because youtube-transcript scrapes an
 * unofficial endpoint and breaks periodically — swapping the implementation
 * later is a one-file change.
 */
export async function fetchTranscript(youtubeVideoId: string): Promise<string | null> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(youtubeVideoId);
    if (!segments.length) return null;
    return segments.map((s) => s.text).join(" ");
  } catch {
    return null;
  }
}

/** Splits a long transcript into overlapping chunks so extraction stays within context limits. */
export function chunkTranscript(transcript: string): string[] {
  if (transcript.length <= CHARS_PER_CHUNK) return [transcript];
  const chunks: string[] = [];
  let start = 0;
  while (start < transcript.length) {
    const end = Math.min(start + CHARS_PER_CHUNK, transcript.length);
    chunks.push(transcript.slice(start, end));
    if (end === transcript.length) break;
    start = end - OVERLAP_CHARS;
  }
  return chunks;
}
