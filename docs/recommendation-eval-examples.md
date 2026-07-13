# Recommendation evaluation examples

Use these prompts as manual regression checks whenever the descriptor taxonomy,
evidence aggregation, ranking, or "more like this" logic changes.

## Mood and emotional-state prompts

- "I feel like shit."
- "I need something comforting but not childish."
- "Give me something uplifting that does not feel cheesy."
- "I want a cathartic cry."
- "I want something low-stress tonight."
- "I want something bleak but beautiful."

## Weirdness and taste prompts

- "I want a bizarre movie."
- "Something surreal and funny but dark."
- "Give me a cult movie that feels unhinged."
- "I want something like After Hours."
- "I liked The Lobster but want something warmer."

## Practical constraints

- "Something funny but not stupid."
- "A short movie under 90 minutes that still feels complete."
- "A comfort movie that is not too childish."
- "A visually stunning slow burn."

## Expected review criteria

- The returned titles should have evidence-backed descriptors matching the
  request, not just broad genre overlap.
- The explanation should cite trusted recommendation evidence rather than
  generic plot or popularity.
- "More like this" should favor shared evidence descriptors and curator signal,
  not just IMDb votes or primary genre.
