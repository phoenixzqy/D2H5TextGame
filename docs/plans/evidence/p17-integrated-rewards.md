# P17 — Production offline return and earned bonus rewards

Verified locally on 2026-11-04, HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained source. This closes the missing offline-return/native-XP/save
integration slice; full P17, idle/MF coverage and private v1 remain open.

## Behavior and proof

`tests/pwa/offline-rewards.spec.ts` ordinarily creates a Sorceress, hires the
free Inner Sight Rogue, learns Fire Bolt, and assigns the shipped canonical
combo option. No import fixture, game bridge, storage/store write, forced click,
injected lifecycle event or campaign replay establishes progress.

The production service worker controls the page before Save/export. Real native
readonly IndexedDB observation equals the entire exported logical save, including
the physical `json-v1` envelope's parsed payload. The clock is installed and
paused while the page is blank, before application startup.

| Instant | Independent expectation |
| --- | --- |
| 1792497600000 | Save created character; no XP or existing bonus |
| +8 hours, old page closed | New page opens with network disabled; successful SW document; bonus 1.5 / 7200 seconds |
| +30 minutes online | Bonus 1.375 / 5400 seconds; no direct offline XP, loot, currency or quest changes |
| +1500ms native wave settlement | Bonus 1.374895833… / 5398.5 seconds; XP sampled at this award instant |
| Actual close/new page, same instant | Entire committed save and exported save equal earned state; no extra XP or refreshed window |

Whole-save comparisons at return and after decay independently permit only the
declared timestamp/idle fields to change. These comparisons rule out direct
offline income. Online bonus decay is delivered through the real application
timer. Native map entry, Skip, wave transition and Flee settle exactly one wave.

The DOM's compact enemy stack badges are included in the kill count. Blood Moor
wave 1 contains eight level-2 Fallen/Quill Rats, worth 20 base XP each. Per-kill
flooring gives `8 × floor(20 × 1.374895833…) = 216` hero XP, distinct from
unboosted 160, original-peak 240 and flooring the aggregate. Mercenary sharing
gives `floor(216 × .75) = 162` XP. Every case verifies these exact totals and
attaches the earned save and independent oracle to its report.

## Notification correction and failed attempts

The mobile export status overlapped Map and intercepted input (BUG-672). A new
real `elementFromPoint` check reproduced this on original production before the
source correction. The passive Settings notification now uses
`pointer-events-none`; its status role, text, visual position and dismissal are
preserved. All four final cases require ordinary Map navigation while that
notification is visible, without advancing bonus time to dismiss it.

Original failures remain retained. V1 used an authored skill ID where the combo
requires its canonical runtime ID (BUG-670); no combat occurred. V2 desktop
English passed one wave. V3 had two startup clock races (BUG-671) and one mobile
notification interception timeout, all before combat. V4 fixes the clock and
fails the explicit mobile hit test before combat. V5 passes all four cases
after the single-class notification correction. No failed gameplay was rerun
to tune outcomes; there are five earned first-wave awards across V2/V5.

## Validation and provenance

| Affected check | Result |
| --- | --- |
| Production build with `VITE_E2E` unset, isolated `production-v5` output | Passed; Vite 21.94s |
| Emitted production JS scan / active service worker / no browser bridge | Passed; ten chunks, no forbidden symbols |
| Scoped strict types and explicit lint for test/config/Settings | Passed |
| Production desktop 1280×800 and mobile 360×640, en and zh-CN | **4/4 passed, 34.3s**, no retries/skips/flaky cases |
| Whole-save return, decay, earned award and same-time offline reopen | Passed in all four cases |
| Source/control review | Root review found no material issue within this bounded scope; umbrella independent acceptance remains open |

Packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-integrated-rewards-v1`.
`browser-v5.json`, `results-summary.json`, source SHA256 manifests, emitted build
hashes, archived runner, build/type/lint logs and original failed traces bind the
reported observations. The only production-source change from the original
packet is Settings' notification pointer behavior. The exact isolated runner
overrides one config object, preventing inherited webServer concatenation.
Its earlier incorrect two-object runner/build is retained as a harness failure.

Security check: pass; local browser/UI verification and task-owned outputs only.
No install, credentials, CI change, external publication or save-format change.
Existing large-chunk/optional-art-manifest build warnings remain. First-wave
loot forces normal rarity, so this is not an independent browser MF rarity
oracle. Broader idle/background, install/device, update/migration, accessibility,
performance, economy/pacing and final integration requirements remain open.

The following affected P17 reader check also passes four cases without another
build. Every consumer is terminal; ports4326/4396 are closed. Isolated production
outputs, both temporary runners/types config and the unexpected766-file `dist`
(verified unchanged against its original manifest) are removed and verified
absent. `cleanup-closure.json` records exact paths and no cleanup failures. Root
retains this packet and sibling `p17-native-reader-v1` for umbrella review and
owns eventual evidence cleanup/release. The active human2 worktree stays claimed.
