# BUG-353 — Verify the headed Chromium prerequisite before C2 idle admission

- Status: Open — QA tooling/environment; no game defect established.
- Severity: Medium. An available compatible headed browser or a separately
  prepared browser installation can resolve the launch prerequisite.
- Found: 2026-10-27.
- Build: `7abf1674da004150a1a82c26c7dcec80c98959bf`,
  `feat/playable-foundations`.
- Owner: `qa-engineer` / `technical-director` (browser harness/environment).

## Reproduction

1. Use the approved first-observation C2 idle harness and audited production
   build with runtime snapshot
   `0c42e4f448b55e55db4a3493c825ef24a0d843343a0316c443ba798eb54a3a94`.
2. Execute `run-idle.py` once. The owned preview starts on localhost39672;
   `run-check.py` records the native browser process and its unchanged inputs.
3. Playwright1.59.1 attempts `chromium.launch({ headless: false, ... })`.

Planned viewport1280×800 / English / native1× clocks. Browser version is
unavailable because launch failed. No context, navigation, save import,
gameplay admission or engine seed execution occurred. The retained native17
source was prepared but never imported. Original tool session85120 exited1
and its terminal result was consumed; no retry was performed.

## Expected

The exact headed executable needed by the frozen harness exists before the
first-observation card begins. A real foreground/hidden-tab browser diagnostic
can then start under the approved protocol.

## Actual

Native process exits1 after0.606s with:

```text
browserType.launch: Executable doesn't exist at
/home/felixzhao/.cache/ms-playwright/chromium-1217/chrome-linux64/chrome
```

The post-failure read-only inventory confirms the expected executable is absent.
The shared cache contains a1217 headless shell and other headed revisions;
neither was substituted or launched. No browser-environment or case results
were created. The wrapper reports the native failure, closes its exact preview
process, and verifies port39672 closed. All recorded PIDs are absent.

## Evidence and limits

Root retains the failed card in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-c2-idle-acfgrg_3.evidence.tar.gz`
with sibling manifest, retention and cleanup receipts. Its decisive members are
`idle-browser.log`, `idle-browser-process.json`, `idle-browser-receipt.json`,
`harness-freeze-before.json`, `harness-freeze-after.json`,
`preview-terminal.json`, `outer-terminal.json`,
`post-failure-inspection.json` and `diagnostic-outcome.json`.

This is an inconclusive environment outcome with zero completed cases and
zero admissions. It provides no foreground/hidden-tab idle, persistence,
conservation, pacing, balance or full-C2 acceptance. No runtime inputs changed.

## Follow-up

Preserve this first-observation result. Before any separately approved future
card, resolve and verify the exact compatible headed browser and record its
identity in the reviewed harness prerequisites. Do not retry or tune this card,
substitute synthetic visibility, or interpret the launch failure as gameplay
failure. No game-code repair has been attempted.

## Subsequent prerequisite — 2026-10-27

The [separate native prerequisite](../../docs/plans/evidence/c2-idle-browser-prerequisite.md)
preserves the original failure. The pinned installer rejects Ubuntu26.04-x64
before download. A reviewed explicit existing Chromium1248 launch succeeds,
but its blank-page cover-hidden assertion times out; missing reached-state
and target/window evidence leaves the cause unresolved (BUG354). That browser
reports156.0.8078.4 with Playwright1.59.1, so compatible default installation
and general compatibility are not established. No app/gameplay runs or C2
acceptance occurred. This report remains open; the original card was not retried.
