# D06 — finite Corpse Explosion production acceptance

Date: 2026-10-22. Bounded functional and presentation evidence under the
[accepted contract](../decisions/D06-corpse-consumption-v1.md). This does not
establish earned progression, affordability, balance, player feel, full
D06/P09/P10 or private-v1 completion. Independent verdicts and publication
bindings are recorded in execution-ledger v1bz.

## Delivered path and prerequisites

| Commit | Accepted increment |
| --- | --- |
| `ddd918c` | Finite shared wave-local corpse contract |
| `7cd5768` | Strict Player authority, primary-death FIFO, one-body payment and preserved outcomes; sparse-effect regression included |
| `ca8f641` | BUG-075 closure and regression evidence |
| `bd62ea3` | Bilingual available/consumed combat feedback |
| `cdfec4e` | Native authority composition, allocation preservation, replay, wave, reward and save regressions |
| `6eb41de` | Truthful bilingual Skills requirements, rank previews and allocation tests |

The engine/native tests, described in ledger v1bv–v1bx, cover authority failures,
19/20 MP, cooldown, all-dodge consumption, actual death supply, shared FIFO,
reward identity, replay and new-wave isolation. These are separate from the
four browser cases below; browser screenshots alone do not establish those
engine edge cases.

## Production reproduction

[Config](../../../tests/pwa/corpse-explosion.config.ts) runs
[spec](../../../tests/pwa/corpse-explosion.spec.ts) serially with one worker,
zero retries, maxFailures1, 90 seconds per case and a 30-second event wait.
Chromium desktop uses 1280×800; Pixel 5 emulation uses 360×640 with touch context.
Each project runs English and zh-CN. This is browser emulation, not physical
device, complete accessibility or performance certification.

Root built with `VITE_E2E` removed using `npm run build -- --outDir <ROOT>/dist`.
The task-local build wrapper scans the four JS chunks for the same forbidden
test-bridge identifiers as `scripts/check-test-bridge-shaken.mjs`. It avoids
deleting a shared repository build. Every native page also asserts no `__GAME__`.
Run against those exact production bytes:

```sh
CORPSE_DIST=<ROOT>/dist CORPSE_OUTPUT_DIR=<ROOT>/browser-lowercase \
CORPSE_REPORT=<ROOT>/browser-lowercase-report.json \
npx playwright test --config tests/pwa/corpse-explosion.config.ts
```

`ROOT` is the retained evidence directory below. `PWA_PORT` defaults to4398;
use another free port if necessary. Playwright owns preview-server lifetime.
Fixed Date is `2026-10-21T12:00:00.055Z`; native timers and 1× playback remain live.
Fresh-module manual ordinal0 is entered and fled for allocation; observed combat
is ordinal1. A new page resets the module and supplies the fresh ordinal0
control. These ordinals are inferred from production challenge composition and
the explicit navigation history, not from a hidden browser-state read.

## Ordinary controls and measured results

Each case creates a fresh Necromancer, selects its locale, then imports explicitly
**unearned** L6, Teeth1, two skill points, survival gear and resources through
Settings. Native keyboard allocation learns CE1 and upgrades CE2. Exact exported
Player deltas and the paused combat log/cards/bars are preserved. The Skills
description and current/next rows show rank1 50–80, rank2 56–86, next62–92,
20 MP, 2 seconds and Ignite/点燃. Combo controls place CE before Teeth.

A read-only MutationObserver captures rendered MP, log rows and enemy cards;
it neither reads stores nor changes simulation, resources or the DOM. All four
cases start with living enemies, open with Teeth while the pool is empty, then
show death → available1 → CE with surviving enemies → silent MP108→88 debit →
consumed0 → outgoing hero fire damage74. The payment frame keeps the cast log
unchanged. Each accepted timeline has57 frames, cast frame51 and debit frame52;
none reaches the512-frame cap. CE appears after7.239–7.291 seconds of native
observation. Engine tests separately establish exact cooldown operation.

| Case | Duration | Layout samples | Console errors/warnings |
| --- | --- | --- | --- |
| Desktop en | 21.552s | 9 | 0 |
| Desktop zh-CN | 21.394s | 9 | 0 |
| Mobile en | 18.323s | 1 | 0 |
| Mobile zh-CN | 18.370s | 1 | 0 |

The complete browser report passed4/4 in82.660s (wrapper84.048s), with zero
unexpected, skipped, flaky, retry or report-error results. Process-level
NO_COLOR/FORCE_COLOR notices are retained separately from browser console data.
After fleeing, Save → Saved → close → new page → Continue yields an exactly
equal whole exported save, including CE2 and combo order. The new native wave
opens with Teeth and no CE, corpse consumption, death or availability feedback;
every enemy remains alive with positive HP at that predeath control.

Nine desktop-context sizes are360×640,412×915,640×360,375×667,393×851,768×1024,
1280×800,1920×1080 and915×412. Both mobile cases additionally measure360×640.
Changed node/button targets are at least80px wide and48px high; nine-point hit
grids are clear, description text is14px and horizontal overflow is absent.
Long detail panels scroll. The24 PNG attachments retain exact original bytes.
Root inspected six representative originals: both mobile descriptions, both
1280×800 descriptions and both mobile combat frames. Mobile combat captures
show the MP bar; offscreen enemy/log claims use the separate DOM timelines.
Existing navigation pictographs render as boxes in this Linux browser/font
environment, as in prior D06 evidence; no full glyph/platform acceptance follows.

## Failed attempts and final checks

Both original failures are retained with source/config snapshots:

1. Initial browser run failed its first case (three not run) after a navigation
   click returned before combat remounted. The snapshot queried no log element
   and compared `[]` with the earlier `Battle starting…`. Waiting explicitly for
   the combat log to become visible fixed route readiness without removing the
   exact frozen-combat comparison.
2. Route-ready run also failed its first case (three not run). The English matcher
   incorrectly required uppercase `Fire`; production uses lowercase `fire`.
   Its complete timeline already showed death at4.741s, cast at7.263s, debit and
   consumption before outgoing74 fire damage at7.432s. Root initially inspected
   the final frame, already in a later wave, and incorrectly described insufficient
   first-kill time. The complete timeline corrected that diagnosis. A proposed
   longer timeout was reverted before execution; accepted bounds, seed, fixture,
   native speed and payment/event assertions remain unchanged.

The final test bytes passed full7874tests/254files142.30s (wrapper143.842s),
typecheck19.592s and lint47.805s, including purity91files. The external production
build/bridge scan passed9.931s. No product or engine source changed in this card.
The existing full15s/engine3s budgets and Browserslist/chunk/precache warnings
remain unresolved; no separate engine rerun or broad release acceptance is claimed.

## Retention and remaining acceptance

Root retains command receipts, captured sources, failed/passing reports, JSON
timelines, summary metrics, screenshots and frozen review/publication records at:

`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-corpse-browser-qylaye9r`

Root owns their removal after umbrella-plan evidence consumers finish. Exact
task-owned `dist/` and `tmp/` disposal is verified after all readers release;
the next ledger entry records the committed cleanup receipt. Shared caches,
dependencies, installed browsers/fonts and the ongoing worktree are preserved.

Next reconcile stale CE register/catalog/inventory statuses, then run a bounded
fresh earned Necromancer-to-CE pilot. Human assessment of whether the transition
is understandable and satisfying remains open. Poison Explosion needs its own
DoT/consumption contract. Other corpse consumers, remaining summon identity,
earned economy/build/campaign evidence, D06/P09/P10 and private-v1 remain open.
