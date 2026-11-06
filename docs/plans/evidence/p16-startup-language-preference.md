# P16 — Startup language preference

2026-11-04; BUG722 locally resolved; full private v1 remains incomplete.
`feat/playable-foundations` at `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. Root is the sole writer. Previous goal turn was a status
report and made no implementation progress.

## Change

The forced Chinese startup overwrote the detector's existing explicit preference.
`src/i18n/localePreference.ts` now safely reads that same `i18nextLng` key;
i18n initialization and meta-store startup use it. Explicit English is retained;
all other values and unavailable storage default to Chinese. The existing cache
writer, English translation fallback, store reset defaults, native save/import
precedence and save schema are unchanged. Plan review: ready. Security: pass;
allowlisted tiny local preference, no credentials or external transmission.

## Evidence

- Original real-browser reproduction remains in the BUG721 packet. A new
  bootstrap regression independently fails before the production edit and passes
  afterward, checking translations, document language and initial meta settings.
- 19 affected cases pass: startup 5, document language 3, Settings 11. Two selected
  persistence cases additionally verify both saved languages before hydration
  readiness; the other 15 persistence cases were outside this run's filter.
- Scoped strict TypeScript roots/dependencies and four explicit ESLint files pass.
  The task diff is reviewed and source hashes independently rechecked.
- Ten development Chromium 147 checks pass: fresh English-browser Chinese default,
  pre-character English reload, new-character locale export, saved Chinese over a
  conflicting preference, both native import directions, three desktop cached
  preferences, and fresh denied-storage startup/change/reload. Imports preserve
  exact player/inventory data; no application bridge or earned save was used.
- Mobile 360×640 and desktop 1280×800 English Settings screenshots were inspected.
  Document/copy/selected controls agree; desktop preference cases have no horizontal
  overflow. No page errors were recorded. This does not certify production PWA,
  real devices, general accessibility/performance, soak or final acceptance.

Initial test evidence is retained: a cold store transform exceeded the per-test
timeout, and the detector's external module cached storage availability across
module resets, invalidating a later denied-getter simulation. Cold transform was
moved to setup; actual denial is verified in a fresh browser context. The English
regression was separately confirmed red before the fix. No existing assertion or
production behavior was weakened to pass these setup failures.

## Retention and remaining work

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-locale-startup-ybab12cl`.
It retains plan/review/security, original/final source bytes and hashes, task patch,
red/final test and type/lint receipts, native disposable-character exports, browser
driver/report/screenshots, validation and cleanup. All seven tool handles are
terminal; browser/server PID4137076 is absent and port5173 closed. The exact Vite
cache is removed and scoped config archived. No remaining disposables or cleanup
failures. Root retains the packet and claimed human2 worktree through unfinished
umbrella acceptance, then owns exact cleanup/release.

**14/14 Act I; 12/14 intended Normal; formal 0/210** stay unchanged. Zeal,
qualifying earned Double Swing, economy/30–50 active-hour pacing, higher
difficulties/endgame, broader app/PWA/a11y/performance, soak and independent
acceptance remain open. No completed-act replay, broad tests/build, new agents,
install, commit, push or CI. Browser works; no pending answer or external hold.
