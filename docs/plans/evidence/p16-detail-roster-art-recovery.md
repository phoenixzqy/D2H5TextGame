# P16/F19 — Inventory detail and mercenary artwork recovery

2026-11-05; BUG762 fixed locally, uncommitted on `feat/playable-foundations` at
`b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus inherited changes. Full private
v1 remains unfinished.

Inventory detail and the mercenary hire/owned portraits bypassed the existing
image recovery boundary. Failed images stayed mounted without a fallback or
reconnect handler. The three sites now use `GameImage`, including its keyed source
identity. The shared component/hook are unchanged. Existing source URLs, item
containment/64px dimensions, portrait top fitting, localized text and actions remain.
No new assets, retries on a timer, URL cache busting, gameplay, persistence or PWA
changes are involved.

## Verification

- Eight new cases reproduce the retained failed image before production repair
  across en/zh-CN. All 27 selected cases pass across the new detail/mercenary
  recovery files, existing detail/mercenary tests and `GameImage.test.tsx`.
- Strict scoped TypeScript: 643 source/data files, zero diagnostics. Explicit
  four-file ESLint passes. No full-suite, CI, engine or campaign run.
- Chromium 147.0.7727.15: eight constructed cases, 12 surface observations across
  en/zh-CN × 360×640/1280×800. Exact authored URLs are blocked until restoration.
  Failed art falls back and actual offline/online reconnection recovers decoded
  images at the same URL. Switching items after failure loads a different URL
  immediately. Healthy neighboring portraits stay mounted; a later reconnect
  leaves successful art mounted without another target request.
- Item 64px and hire 3:4 frames remain stable through failure/recovery; names and
  actions persist. Recovered art hides/shows under stealth, item close target is
  at least 44px, and no horizontal overflow occurs. Chinese mobile item
  fallback/recovered and recovered hire captures were visually inspected.
- Final pages have zero errors/warnings, unexpected failed requests or pending
  requests. Deliberately blocked image failures are recorded separately.
- The first observer compared the decorative `?` against recovered content and
  failed. Its script/result remain in the packet. Corrected comparison excludes
  only that leading fallback glyph; no production change was required for it.
  Vite reports stale shared Browserslist data; no dependency/cache update was made.

## Evidence custody

Exact retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-roster-detail-art-ae079zvi`.
It holds source baselines/diff/hashes, causal RED and selected GREEN results,
types/lint logs, browser drivers/results/screenshots and cleanup/self-review.
Root retains it through full-v1 acceptance and owns eventual removal. The browser
and server close in the driver; its terminal PID and exact disposable Vite cache
are checked in the cleanup receipt. No commit/push/release or ownership change.

This closes another F19 implementation gap. It does not certify wider art
provenance/budgets, production PWA behavior, integrated acceptance or gameplay
balance. Historical 14/14 intended Normal completions, 210 checkpoint sources and
0/210 formal balance acceptance are unchanged. No exhausted campaign/sample/area
allowance was renewed. Continue remaining progression/challenge/acquisition/pacing
implementation and final integrated acceptance; no user hold.
