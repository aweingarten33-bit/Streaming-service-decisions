import { YoutubeTranscript } from "youtube-transcript";

// Rough heuristic (~4 chars/token) — good enough for chunk sizing, not billing.
const CHARS_PER_CHUNK = 32_000; // ~8k tokens
const OVERLAP_CHARS = 2_000;

export type TranscriptFailureReason =
  | "empty_transcript"
  | "no_captions"
  | "youtube_blocked"
  | "video_unavailable"
  | "transcript_fetch_error";

export interface TranscriptFetchResult {
  text: string | null;
  failureReason: TranscriptFailureReason | null;
  failureDetail: string | null;
}

function classifyTranscriptError(error: unknown): TranscriptFailureReason {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  if (
    lower.includes("disabled") ||
    lower.includes("no transcript") ||
    lower.includes("could not find")
  ) {
    return "no_captions";
  }
  if (
    lower.includes("too many") ||
    lower.includes("429") ||
    lower.includes("blocked") ||
    lower.includes("captcha")
  ) {
    return "youtube_blocked";
  }
  if (lower.includes("unavailable") || lower.includes("private") || lower.includes("deleted")) {
    return "video_unavailable";
  }
  return "transcript_fetch_error";
}

/**
 * Fetches a video's transcript with structured failure metadata. Isolated
 * behind this module because youtube-transcript scrapes an unofficial endpoint
 * and breaks periodically — swapping the implementation later is a one-file change.
 */
export async function fetchTranscriptResult(
  youtubeVideoId: string,
): Promise<TranscriptFetchResult> {
  try {
    const segments = await YoutubeTranscript.fetchTranscript(youtubeVideoId);
    if (!segments.length) {
      return {
        text: null,
        failureReason: "empty_transcript",
        failureDetail: "Transcript provider returned zero segments.",
      };
    }
    return {
      text: segments.map((s) => s.text).join(" "),
      failureReason: null,
      failureDetail: null,
    };
  } catch (error) {
    return {
      text: null,
      failureReason: classifyTranscriptError(error),
      failureDetail: error instanceof Error ? error.message : String(error),
    };
    if (!segments.length) return null;
    return segments.map((s) => s.text).join(" ");
  } catch (err) {
    console.log(`    [transcript fetch failed for ${youtubeVideoId}]: ${String(err)}`);
    return null;
  }
}

/** Backward-compatible helper for callers that only need transcript text. */
export async function fetchTranscript(youtubeVideoId: string): Promise<string | null> {
  return (await fetchTranscriptResult(youtubeVideoId)).text;
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
