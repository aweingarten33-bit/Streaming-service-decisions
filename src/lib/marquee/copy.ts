export type Language = "unfiltered" | "clean";

// Fixed regardless of language setting -- "WTF" is the whole brand hook, not
// something Clean-ish softens away.
export const HEADLINE = "WTF are you in the mood for?";

export interface PromptOption {
  unfiltered: string;
  clean: string;
}

// Built-in conversational prompts, each naming a genuinely different mood or
// constraint -- no near-duplicate "just pick something for me" restated four
// different ways, and no media-type phrasing now that Home has its own
// explicit Movie/TV toggle. Not every line is profane -- the humor is in
// accurately naming what the user is already thinking, not swearing for its
// own sake.
export const PROMPT_BANK: PromptOption[] = [
  { unfiltered: "Pick a fucking adventure.", clean: "Pick something exciting." },
  {
    unfiltered: "I'm probably gonna be on my phone, so I need something I can half-watch.",
    clean: "I'm probably gonna be on my phone, so I need something I can half-watch.",
  },
  { unfiltered: "Funny, but not completely stupid.", clean: "Funny, but not completely dumb." },
  {
    unfiltered: "Dark, but don't ruin my entire night.",
    clean: "Dark, but don't ruin my entire night.",
  },
  {
    unfiltered: "I want something weird. Good weird.",
    clean: "I want something weird. Good weird.",
  },
  { unfiltered: "Fuck it. You decide.", clean: "Fine. You decide." },
  {
    unfiltered: "Give me something that'll make me forget my phone exists.",
    clean: "Give me something that'll make me forget my phone exists.",
  },
  {
    unfiltered: "Give me something that gets good immediately.",
    clean: "Give me something that gets good immediately.",
  },
  { unfiltered: "I got like 90 minutes.", clean: "I got like 90 minutes." },
  { unfiltered: "Don't make me think that hard.", clean: "Don't make me think that hard." },
  {
    unfiltered: "Something cozy. Like a blanket, but a movie.",
    clean: "Something cozy. Like a blanket, but a movie.",
  },
  {
    unfiltered: "Give me something I can cry to. On purpose.",
    clean: "Give me something I can cry to. On purpose.",
  },
];

interface CopySet {
  inputPlaceholder: string;
  primaryActionLabel: string;
  giveMeAnother: string;
  notTonight: string;
  markWatched: string;
  whyThis: string;
  loadingMessages: string[];
  emptyWatchlist: string;
  emptyWatchlistAction: string;
  noMatch: string;
  relaxAction: string;
  giveMeAnotherInterstitials: string[];
}

const UNFILTERED: CopySet = {
  inputPlaceholder: "Everything looks like shit. Help me out.",
  primaryActionLabel: "Put This Shit On",
  giveMeAnother: "Give Me Another",
  notTonight: "Not Tonight",
  markWatched: "Mark Watched",
  whyThis: "Why This?",
  loadingMessages: [
    "Digging through the shit you saved…",
    "Looking for the least wrong answer…",
    "Checking what you swore you'd watch someday…",
    "Trying to prevent another hour of scrolling…",
    "Alright, let me figure this out…",
  ],
  emptyWatchlist: "You haven't imported anything yet. I can't pick from a list that doesn't exist.",
  emptyWatchlistAction: "Get My IMDb Watchlist",
  noMatch: "Nothing on your list fits all that shit. Wanna loosen one thing?",
  relaxAction: "Fine. Do Your Best.",
  giveMeAnotherInterstitials: [
    "Alright. Apparently not that one.",
    "Fine. Let's try this.",
    "You're making this difficult, but whatever.",
    "Nope? Cool. Here's another one.",
    "Alright, your majesty.",
  ],
};

const CLEAN: CopySet = {
  inputPlaceholder: "Everything looks like a mess. Help me out.",
  primaryActionLabel: "Put This On",
  giveMeAnother: "Give Me Another",
  notTonight: "Not Tonight",
  markWatched: "Mark Watched",
  whyThis: "Why This?",
  loadingMessages: [
    "Digging through what you saved…",
    "Looking for the least wrong answer…",
    "Checking what you swore you'd watch someday…",
    "Trying to prevent another hour of scrolling…",
    "Alright, let me figure this out…",
  ],
  emptyWatchlist: "You haven't imported anything yet. I can't pick from a list that doesn't exist.",
  emptyWatchlistAction: "Get My IMDb Watchlist",
  noMatch: "Nothing on your list fits all that. Wanna loosen one thing?",
  relaxAction: "Fine. Do Your Best.",
  giveMeAnotherInterstitials: [
    "Alright. Apparently not that one.",
    "Fine. Let's try this.",
    "You're making this difficult, but whatever.",
    "Nope? Cool. Here's another one.",
    "Alright, your majesty.",
  ],
};

export function getCopy(language: Language): CopySet {
  return language === "clean" ? CLEAN : UNFILTERED;
}

export function getPrompt(option: PromptOption, language: Language): string {
  return language === "clean" ? option.clean : option.unfiltered;
}

// Onboarding + import copy -- no profanity either way, so no language variant needed.
export const ONBOARDING = {
  headline: "Let's get your IMDb watchlist in here.",
  supporting:
    "IMDb already has the stuff you wanna watch. Export it once, upload it here, and we'll handle the rest.",
  // Why a CSV at all, instead of just connecting an account: IMDb has no
  // public way for an app to read someone's watchlist directly. A CSV
  // export -- IMDb's own built-in way for you to get your own data out --
  // is the only real option, and it only has to happen once.
  whyCsv:
    "Why a file? IMDb doesn't let outside apps read your watchlist directly. Exporting it yourself is the only way -- it's a one-time, one-minute thing.",
  browserOnlyWarning:
    "This only works from a browser (Safari, Chrome, etc.) -- not the IMDb phone app. If you're on your phone, open imdb.com in your browser, not the app.",
  primaryAction: "Open My IMDb Watchlist",
  secondaryAction: "I Already Have the CSV",
  steps: [
    "Open imdb.com in a browser and sign in (not the IMDb app).",
    'Click your account icon (top right), then "Your Watchlist."',
    'On your Watchlist page, find the "Export" link near the top of the list.',
    'Tap Export -- a file (usually named "WATCHLIST.csv") downloads to your device.',
    'Come back here and tap "I Already Have the CSV" to select that file.',
    "We'll match every title against our database and flag anything we can't confidently identify.",
  ],
  imdbWatchlistUrl: "https://www.imdb.com/list/watchlist",
  pickSomething: "Let's Pick Something",
  reviewWeirdOnes: (count: number) => `Review the ${count} Weird One${count === 1 ? "" : "s"}`,
};

interface ExploreCopySet {
  headline: string;
  searchPlaceholder: string;
  noResults: string;
  searchFailed: string;
  openInImdb: string;
  save: string;
  saved: string;
  savedListsTitle: string;
  noSavedLists: string;
}

const EXPLORE_UNFILTERED: ExploreCopySet = {
  headline: "Find people's lists. Steal their taste.",
  searchPlaceholder: "Forgotten '90s thrillers, weird documentaries, whatever...",
  noResults: "Apparently nobody made that exact list yet. Try saying it less specifically.",
  searchFailed: "The internet is being useless. Try that again.",
  openInImdb: "Open List in IMDb",
  save: "Save",
  saved: "Saved",
  savedListsTitle: "Saved Lists",
  noSavedLists: "Nothing saved yet. Find a list you like and keep it here.",
};

const EXPLORE_CLEAN: ExploreCopySet = {
  headline: "Find people's lists. Borrow their taste.",
  searchPlaceholder: "Forgotten '90s thrillers, weird documentaries, whatever...",
  noResults: "Nobody's made that exact list yet. Try saying it a little more broadly.",
  searchFailed: "That didn't work. Try again in a second.",
  openInImdb: "Open List in IMDb",
  save: "Save",
  saved: "Saved",
  savedListsTitle: "Saved Lists",
  noSavedLists: "Nothing saved yet. Find a list you like and keep it here.",
};

export function getExploreCopy(language: Language): ExploreCopySet {
  return language === "clean" ? EXPLORE_CLEAN : EXPLORE_UNFILTERED;
}

// Deterministic fallback lines for the Home teaser -- used when there's no
// API key or the call fails, keyed loosely to watchlist size so it's not
// completely disconnected from reality even without a live call.
export function fallbackTeaser(activeCount: number, language: Language): string {
  const unfilteredLines = [
    `${activeCount} things you swore you'd watch. Let's fix one.`,
    `Your list has ${activeCount} unwatched titles judging you silently.`,
    `${activeCount} options. Zero decisions made yet.`,
  ];
  const cleanLines = [
    `${activeCount} things you swore you'd watch. Let's fix one.`,
    `Your list has ${activeCount} unwatched titles waiting on you.`,
    `${activeCount} options. Zero decisions made yet.`,
  ];
  const lines = language === "clean" ? cleanLines : unfilteredLines;
  return lines[activeCount % lines.length];
}

export function importSummary(imported: number, duplicates: number, needHelp: number): string {
  const parts = [`Done. ${imported} title${imported === 1 ? "" : "s"} imported.`];
  if (duplicates > 0) parts.push(`${duplicates} duplicate${duplicates === 1 ? "" : "s"} ignored.`);
  if (needHelp > 0) parts.push(`${needHelp} need${needHelp === 1 ? "s" : ""} your help.`);
  return parts.join(" ");
}
