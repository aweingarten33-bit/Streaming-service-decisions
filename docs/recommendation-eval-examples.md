# Marquee decision examples

These are manual prompts the watchlist decision flow should handle without ever
asking the AI to recommend a title directly.

- "Everything looks like shit."
- "Don't make me think."
- "I got like 90 minutes."
- "Give me something that gets good immediately."
- "I'm probably gonna be on my phone."
- "I want something that'll make me forget my phone exists."
- "Something but not a whole fucking commitment."
- "Dark thriller under 2 hours."

Expected behavior:

1. AI or local fallback translates the prompt into structured intent.
2. Deterministic scoring searches only the user's unwatched watchlist items.
3. The API returns exactly one title.
4. The explanation is short and practical.
