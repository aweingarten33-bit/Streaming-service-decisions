export interface SubredditConfig {
  name: string;
  upvoteThreshold: number;
  active: boolean;
}

/** Adding a subreddit is one entry here. */
export const subreddits: SubredditConfig[] = [
  { name: "MovieSuggestions", upvoteThreshold: 20, active: true },
  { name: "televisionsuggestions", upvoteThreshold: 20, active: true },
  { name: "NetflixBestOf", upvoteThreshold: 20, active: true },
  { name: "ifyoulikeblank", upvoteThreshold: 20, active: true },
];
