# D05 — Oak Sage and Heart of Wolverine

Runtime `5e1532e7b2ff3a8c47aab8c559867d240cf7d3b2` implements
[BUG188](../../../production/bugs/BUG-188-druid-ally-auras-markers.md) under the
[local contract](../decisions/D05-druid-ally-auras-v1.md). Only Oak Sage and Heart
of Wolverine receive bounded local functional credit. Independent design/QA and
earned class/build balance remain open. Spirit of Barbs still owes its advertised
summoned spirit and receives no credit.

Authored unlocks, prerequisites, coefficients and cap20 are unchanged. Oak unlocks
at6 and adds3% life capacity per allocated rank. Heart unlocks at18, requires
learned Oak, and adds3% Attack plus0.5percentage-point critical chance per rank.
The stale fixed50% Oak and30% attack-speed Heart prose is replaced with the actual
rank-scaled behavior. No new speed coefficient, active cast, mana cost, cooldown,
random draw, persisted capability or save migration is introduced; Save22 remains.

Native class, integral level, exact aliases/MAX/caps and prerequisites determine a
copied per-wave projection bound to the original hero and fielded mercenary.
Living source hero, original merc and source-owned living summons qualify.
Foreign, bench, dead, opponent and forged-owner units do not. Source death removes
the effects before death-related recovery; crowd control alone does not. Heart
changes real basic/ranged Attack-scaled damage and the existing critical/overflow
pipeline while preserving stored stats, fixed skill damage and draw order.

One engine-owned capacity settlement restores the outer ambient and inner paid
form layers, then adds independently floored bonuses over a single fresh base.
Base1000 with form60% and Oak60% becomes2200, retaining1700HP above either partial
cap; adding Vigor40% yields2600. Capacity gain never heals, genuine healing/orbs can
fill it, and removal performs one final clamp. The existing transient `vigorLife`
slot transports combined ambient capacity and is explicitly documented. Native
snapshots retain fresh base capacity and original absolute HP until complete party
registration; ordinary units without a pending temporary layer still clamp to
fresh equipment. Initial status prefixes, capacity events and committed spawn
events expose the same actual maximum. Current recordings stay frozen; rank,
respec and equipment changes apply next wave. Original-resource replay remains
repeatable without duplicate rewards. Localized positive derived aura chips
disappear on source death and never grant runtime authority.

## Verification and limits

At unchanged `03b115a`, corrected native causal RED has5 failures/3 passing
controls: Oak leaves999382 capacity unchanged, Heart leaves the first1024damage
hit unchanged, and paid wolf alone yields1599011 instead of2198640 with Oak.
The initial8failure attempt omitted hydration readiness and is retained as a
fixture error, not mechanic evidence. The final causal8, pure11, shared-capacity4,
allied-engine12, native3, causal-playback1 and localized-component10 cases all pass
in the final full suite;49 new tests across8 files are added overall.

Original integration regressions are preserved. Existing native bear cases exposed
lost paid capacity on death: private capacity authentication now retains a valid
dead paid form while public gameplay bonuses still require life. A new causal
playback RED exposed rejected carried form state surviving only in presentation:
explicit removal observations now follow the complete initial-status prefix.
The unchanged native Vigor replay case rejected an early native pre-projection:
the engine now owns the final projection over the fresh-base snapshot. Final
native-capacity compatibility is **79 tests/7 files**, including the unchanged43
Might/Vigor tests. No assertion or timeout was weakened for these corrections.

Final engine **6656 tests/231 files**, typecheck, standard lint, explicit
`VITE_E2E=false` production build and four-chunk bridge scan pass. Standard
**`npm test`:12962 passed/559 files, two existing skips** passes in707.801s wrapper
wall time. All1280 source/test/config hashes,760 production build hashes, HEAD,
Git status and the genuine save digest match exactly before/after that full run.
Every one of the1280 committed source blobs separately matches the validated
snapshot. The run time exceeds the documented test-loop budget; this functional
pass does not establish test or device-performance acceptance.

Production en/zh-CN ×1280×800/360×640 **4/4** passes with public character creation,
import, allocation, combat and save controls; no test bridge/direct store mutation
is used. Both skills upgrade19→20. Eight separately audited Save-close-new-page-
Continue pairs preserve player/inventory/map/mercs/formation exactly, Save22,
allocations, points and empty combo. Twenty geometry samples span360,412,
640landscape,1280 and1920 widths. Four cases expose the actual62.5% compact-card
health strip after Oak and both localized positive chips, with no page errors.
Twelve screenshots are retained; eight representative Heart/detail and combat
screenshots across both locales and viewports were inspected. Browser inputs are
explicitly synthetic L30/rank/large-gear imports; they earn no campaign progress or
balance credit. Exact capacity, payment and damage semantics come from native and
engine assertions rather than the screenshot percentage alone.

All original failures remain: schema/fixture corrections, missing merc grid
position, omitted status-playback state, original rejected-carry playback RED,
Vigor snapshot regression, lint/type errors and the unused import removed before
the final freeze. The deliberately interrupted earlier full run exits130 and is
not an acceptance pass; its exact owned-process SIGINT receipt is retained.
The final lint and suite are terminal/0. Existing mobile bottom-navigation
occlusion can hide the second chip; a browser visibility assertion does not prove
absence of occlusion. Font/icon fallback, below-fold details, chunk-size and large
asset-manifest warnings remain. Full UX/accessibility/PWA/device performance,
coverage release gates and independent acceptance are not established here.

Only the two named inventory rows change;213 IDs/order remain:
**147 unverified,64 bounded-functional,one bounded-engine-functional,one
review-needed**. The dispositions have different proof scopes. Genuine
Ancients401 decompressed SHA256
`c4a543af9db6b6b926ece07417b82c80c39615a53cbb03e2a358074f019a7577` remains
L33/XP149261/23682gear/nextNormal402/Nightmare0, Ancients/Rite claimed and Baal
uncleared. No genuine campaign or remote publication action occurred. C2–C4,
all213skills, earned builds/economy/pacing/endgame/PWA/performance, independent QA,
fullG0–G7 and complete privatev1 remain unfinished. Umbrella goal/branch/worktree
claim remain active; root is the sole writer.

## Retention and cleanup

[Manifest](fixtures/druid-ally-auras/manifest.json) and
[raw archive](fixtures/druid-ally-auras/raw.tar.gz) retain every required original
failure, script/fixture, terminal result, browser export/screenshot, frozen input
receipt, review and committed-source check. Each archived file is independently
byte/hash checked before disposal of its source. The
[cleanup receipt](fixtures/druid-ally-auras/cleanup.json) records exact task-owned
build/scratch removals, scratch absence, port4475 closure and any remaining paths
or failures. Shared caches, the umbrella checkout/history and earlier required
campaign evidence are intentionally preserved. Exact terminal counts are in the
manifest and cleanup receipt.

Final retention/cleanup is terminal:166 raw files and46 terminal result records
are byte-verified in the archive;3206 exact task-owned files are removed. The
scratch directory is absent, port4475 is closed, remaining paths[] and failures[].
