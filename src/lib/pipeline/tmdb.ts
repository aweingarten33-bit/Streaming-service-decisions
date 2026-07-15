import { requireEnv } from "./env";
import type { MediaType, ResolvedMediaType } from "./types";

const BASE = "https://api.themoviedb.org/3";
const MAX_ATTEMPTS = 5;

const GENRE_NAMES: Record<number, string> = {
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy