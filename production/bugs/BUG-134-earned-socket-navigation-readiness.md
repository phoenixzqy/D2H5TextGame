# BUG-134 — Await the combat route before reading its wave

Status: harness correction implemented locally; no native replay performed.
Severity: Medium (QA tooling; ordinary navigation completes).
Owner: qa-engineer. Affected system: earned socket Playwright evidence.

Build: runtime f8767f8, revision4 harness SHA256 in the retained freeze.
Environment: Chromium, production preview, English, 360×640, 2026-10-23.
Native Normal challenge ordinal253; no supplied seed or clock override.

1. Import the exact retained earned v18 export and perform the ordinary Eld
   insertion/equip/Continue sequence in `tests/pwa/socket-earned.spec.ts`.
2. Launch Catacombs once, observe wave1 victory, pause native wave2 and export
   the settled wave1 rewards through Settings.
3. Click the ordinary `/combat` navigation link and immediately evaluate the
   wave counter without waiting for the route's screen.

Expected: establish combat-screen readiness, then assert the paused wave2
identity before Resume. A genuinely different wave must still stop immediately.

Actual: the immediate DOM read returns an absent counter (`NaN`), failing
expected2 at spec291. Catch diagnostics subsequently see actual wave2, an empty
log and all living cards. The run stops before Resume; the first-wave rewards
are retained. No console/page errors or diagnostic failures are recorded.

Root cause: `navTo` waits for a link click, not React's destination render;
the next plain evaluation has no Playwright readiness assertion. The local
correction waits for the combat-screen locator before the exact counter check.
It does not wait through a wrong counter, change any deadline or launch again.

Evidence root (root owns retained diagnostics):
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-earned-socket-dmbgdt1a`.
See `browser-report.json` (0expected/1unexpected), `browser.log`,
`failure.json.gz`, `stopped-terminal.json.gz`, `stopped-screen.png`,
`wave-1-settled.json.gz` and `post-browser-source-audit.json` (1819 hashes match).
The original failed harness and freeze are preserved. The corrected wait has
scoped static validation only; no passing six-wave browser result is claimed.
