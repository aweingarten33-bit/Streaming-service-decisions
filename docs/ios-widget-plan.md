# iOS WidgetKit — implementation path

Honest status: **not built**. A native WidgetKit extension requires an actual
iOS app target in Xcode/Swift, which doesn't exist in this repo (a Next.js web
app can't contain one). What *is* built and real: the backing API endpoint the
widget would call (`GET /api/widget/next-pick`), so the native side has
something real to integrate against on day one.

## What exists today

`GET /api/widget/next-pick`
- Auth: same Bearer-token scheme as the rest of the API (Supabase access token).
- Returns a single deterministic pick from the signed-in user's active
  watchlist, seeded by day-of-year so it's stable across refreshes within a
  day but rotates daily.
- No LLM call -- a home-screen widget can't take free-text mood input, so
  there's nothing to parse intent from.

## What a real native implementation needs (not yet built)

1. **An iOS app shell.** Marquee would need an actual native or
   Capacitor/React-Native wrapper app with a WidgetKit extension target --
   today it's web-only.
2. **A long-lived widget credential.** Supabase access tokens expire in ~1
   hour; a widget refreshing in the background can't do an interactive
   sign-in. The real fix is a dedicated long-lived "widget token" -- a new
   `widget_tokens(user_id, token_hash, created_at)` table, minted once from
   inside the signed-in app (Settings → "Enable Widget"), stored in the
   widget's shared App Group `UserDefaults`/Keychain, and checked against a
   hash server-side instead of a Supabase session JWT. **Not implemented
   yet** -- `next-pick` currently only accepts a normal session token.
3. **The SwiftUI widget.** A `TimelineProvider` that:
   - Calls `next-pick` with the stored widget token.
   - Renders poster + title + runtime in the small/medium widget families.
   - Refreshes once daily (`.after(midnight)` timeline policy) -- matches the
     endpoint's own daily rotation, so no wasted refreshes.
4. **Deep link.** Tapping the widget should open the app straight to that
   title (or to Home with the prompt pre-filled) -- needs a custom URL scheme
   or universal link registered in the iOS app target.

## Why this wasn't built further tonight

Steps 1, 3, and 4 require Xcode and a real iOS project -- there's no way to
write, compile, or test Swift/SwiftUI code inside this Next.js repository, and
claiming otherwise would be dishonest. Step 2 (the long-lived token table) is
real, buildable, testable backend work and is the natural next PR once
someone's actually starting the iOS shell.
