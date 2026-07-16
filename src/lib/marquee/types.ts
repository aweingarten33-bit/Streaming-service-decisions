export interface WatchlistCandidate {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  status: "active" | "watched";
  title: string;
  year: number | null;
  genres: string[];
  runtime: number | null;
  posterPath: string | null;
  backdropPath: string | null;
  streamingProviders: string[];
  tmdbRating: number | null;
  overview: string | null;
  trailerKey: string | null;
}
