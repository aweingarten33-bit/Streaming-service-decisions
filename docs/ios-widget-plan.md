# iOS WidgetKit — implementation path

Honest status: **not built**. A native WidgetKit extension requires an actual
iOS app target in Xcode/Swift, which doesn't exist in this repo (a Next.js web
app can't contain one). What *is* built and real: the backing API endpoint the
widget would call (`GET /api/widget/next-pick`), so the native side has
something real to integrate against on day one.

## What exists today

`GET /api/widget/next-pick`
- Auth: none -- same `X-Device-Id` header scheme as the rest of the API (no
  accounts, no signup, just the id already stored in the browser's
  localStorage).
- Returns a single deterministic pick from that device's active watchlist,
  seeded by day-of-year so it's stable across refreshes within a day but
  rotates daily.
- No LLM call -- a home-screen widget can't take free-text mood input, so
  there's nothing to parse intent from.

## What a real native implementation needs (not yet built)

1. **An iOS app shell.** Marquee would need an actual native or
   Capacitor/React-Native wrapper app with a WidgetKit extension target --
   today it's web-only.
2. **Getting the device id into the widget.** There's no session token to
   worry about since there's no login, but the widget still needs *this
   device's* id to ask for the right watchlist. The real fix is reading it out
   of the app's shared App Group `UserDefaults` (written once by the main app
   from its `localStorage` value) so the widget extension and the web view
   agree on the same id. **Not implemented yet** -- there's no iOS app target
   to write that shared storage from.
3. **The SwiftUI widget.** A `TimelineProvider` that:
   - Calls `next-pick` with the shared device id as the `X-Device-Id` header.
   - Renders poster + title + runtime in the small/medium widget families.
   - Refreshes once daily (`.after(midnight)` timeline policy) -- matches the
     endpoint's own daily rotation, so no wasted refreshes.
4. **Deep link.** Tapping the widget should open the app straight to that
   title (or to Home with the prompt pre-filled) -- needs a custom URL scheme
   or universal link registered in the iOS app target.

## Why this wasn't built further tonight

Steps 1, 2, 3, and 4 all require an actual iOS app target (to have an App
Group to share the device id through, and Xcode/Swift to write the widget
itself) -- there's no way to build or test any of that inside this Next.js
repository, and claiming otherwise would be dishonest.
