# Earned-reward preparation reaches Andariel

At runtime head `aec0041`, one approved deterministic production-service route
wins Blood Moor, Cold Plains, Burial Grounds, Dark Wood and all six Catacombs
waves. The actual level-19 chapter boss Andariel starts at1200HP, dies at19656ms,
and awards three rare items plus190heroXP/142mercXP. This accepts a bounded
integration result from the original earned L12 save. Fresh UI C1 remains open.

## Route and actual awards

The [controlling decision](../decisions/D02-D07-earned-reward-boundary-v1.md)
adds one town equipment boundary after the unchanged four-map winning prefix.
It uses actual owned eligible gear, full production projection, predeclared
role/slot scores, current-item ties and lowest persistent-ID tie-breaking.
Rogue weapon/head are reserved first. Every item with unresolved critical/dodge
units is excluded in full ([BUG091](../../../production/bugs/BUG-091-normalize-rolled-affix-percent-units.md));
no harness normalization or exploit is used. Direct nongrowing swaps only.

| Area / ordinal | Victorious waves |
| --- | --- |
| Blood Moor102 | 3 |
| Cold Plains103 | 4 |
| Burial Grounds104 | 4 |
| Dark Wood105 | 5 |
| Catacombs106 | 6 |

Original input SHA256 is
`8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`.
Clock1792497600000, seed2223645302 and ordinals102–106 remain fixed. All four
prefix runs' complete retained wave observations equal the prior oracle;
initial preparation and pre-route save match too. The old oracle had no complete
post-Dark-Wood export; this run captures that new boundary without claiming an
unavailable full-save comparison.

At the boundary3902unique item IDs are conserved, backpack3889→3887. Live hero
HP120/MP102 are unchanged; projected maxima262/188→284/225, Defense120→150,
Attack56→80, AttackSpeed125→135. Rogue effective Attack100/Defense99. Nongear
player/merc state, map, meta and formation are unchanged. Actual production
challenge entry fills resources; every subsequent hero-wave HP/MP carry passes.

Across22waves, actual added item objects equal raw awards,176new IDs persist
exactly once, zero IDs disappear, and total ownership3737→3913 reconciles.
Actual heroXP totals24070, mercXP18051. Andariel's actual rare IDs are
`it-4x8ao-2pq` (skull cap), `it-3o7yq-2pr` and `it-8xk6k-2ps` (silver rings).
The Andariel wave’s actual currency delta is4245rune-shards/24wishstones/1gem-shard; do not equate
raw reward categories with persisted currency amounts. Catacombs clear is added.
The save remains in ActI; only the previously claimed Den quest is present.
Andariel's quest claim, reward unique and ActII transition were not executed.

Final save SHA256:
`83fb9e8fa765e9c5c1d3840241615317eddaa5706d759b0e742d36ba643d21e8`.
Independent QA verdict: ADEQUATE for the bounded service outcome, including all
644current source hashes, exact script identity, actual boss death and awards,
prefix, resources and item conservation. All QA readers released.

## Ordinary browser transfer and save proof — PASS

Final production Chromium execution:4/4cases, en/zh-CN×360×640/1280×800,
92199.972ms, retries0, no skips, no browser page errors. Each fresh context creates
a placeholder through ordinary controls, publicly imports the exact new earned
boundary-before save, and exports full equality before any transfer. This is
an imported checkpoint test, not fresh acquisition or browser combat.

All11actual transfers and4current-item noops use frozen owned IDs/order. Hero
requirements, comparison and enabled44pxEquip are checked. Merc candidates are
identified by exact evolving backpack order, candidate count and localized row
name; final full export proves the selected/returned IDs. Merc buttons remain
36px; no full mobile/a11y acceptance follows. The whole saved object equals the
service boundary-after, with only the intentional locale-button preference
accounted for. Save, close, new-pageContinue and full exported equality pass in
all4cases; no hidden bridge, store/storage mutation or injected combat inputs.

Defense120→136 is explicitly scrolled into viewport before each screenshot;
[English mobile](fixtures/p01-earned-boundary-en360.png) and
[Chinese mobile](fixtures/p01-earned-boundary-zh360.png) show that row. A hover
tooltip partly covers the upper comparison; the claimed Defense row is clear.
Screenshots do not establish every comparison row or whole-page a11y.

Two unsuccessful diagnostic versions remain retained: first, pretty1.26MB JSON
textarea fill times out before transfers; switching to equivalent compact JSON
matches the earlier accepted native tests. Second, English2cases pass and
Chinese360fails after transfers because the full-save oracle omitted the
explicit language-button change en→zh-CN; Chinese1280is skipped by maxFailures1.
The final oracle adds exactly that expected preference. No gameplay correction,
failed combat reuse, hidden state mutation or weakened item/resource assertion.

## Evidence, validation and limits

[Compact machine evidence](fixtures/p01-earned-boundary-summary.json) retains
all wave awards, boundary transfers, final boss snapshots and file hashes.
[Exact executed route](fixtures/p01-earned-boundary-route.mjs.txt) binds the
original input and prior oracle. [Browser diagnostic](fixtures/p01-earned-boundary-native.spec.ts.txt)
and [configuration](fixtures/p01-earned-boundary-native.config.mjs.txt) use ordinary
controls; final execution outcome is recorded above.

No production or executable repository test source changed. Current source's
previous full8546tests/typecheck/lint/build results are inherited, not rerun or
claimed as a new campaign pass. A fresh VITE_E2E-unset production build succeeds;
all4JS chunks pass the5forbidden-bridge-pattern audit. Existing precache/art
manifest warning remains; no performance acceptance follows.

This route's explicit same seed for each area differs from native Enter's
area/time-derived seed. No browser/imported checkpoint can replace a fresh
creation-to-Andariel run with native-generated inputs. No fullC1, later acts,
seven-class/213-skill completeness, balance, pacing, a11y/PWA/performance or full
private-v1 acceptance is claimed. Next is one joined fresh mobile route, using
actual earned items and normal inputs, then quest reward/save/Continue proof.

## Next finite native route (producer ready)

Use one fresh360×640production context and one page through progression, with
fixedDate1792497600000 but normal native seed/ordinal generation. No import,
store/storage/bridge mutation, retry search or forced drops. Reuse the accepted
[P04a10 fresh setup](fixtures/p04a10-den-earned-clear.spec.ts.txt): exactly40
BloodMoorW1wins then Pause/FleeW2, L6earned normal gear/build, full Den clear,
Akara talk and once-only claim. Include its real375mercXP quest share.

Spend earned later points on IceBlast and2Vitality/3Energy per level. At most100
additional full Den manual challenges toL12; historical61is not a forced count.
Use the approved initial gear policy on actual owned items, FrostNova2/IceBlast8
and Rogue InnerSight→Pierce→Basic. Enter the same four-map order once, then one
approved reward-gear boundary from actual native drops, with BUG091exclusions.
Track SistersToTheSlaughter before the one Catacombs attempt. Stop first nonwin
or integrity failure. Do not close/reload midroute: the native manual ordinal
is process-local. Checkpoints may be exported.

After actual Andariel death prove exact awards, once-only Sisters claim
(8000heroXP, fielded-merc share, Coifilvl19, ActIIunlock), safe earned boss reward
equipment/effect, then Save→close→new-pageContinue exact equality. This is the
next execution policy, not an observation or guarantee of victory. Producer
PLAN READY/security PASS; no new gameplay dependency identified.

Raw root-owned diagnostics remain at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-earned-boundary-WP70rVKS`
through progression/C1 consumers. Full reports, exact before/after/selection/final
saves, scripts, audit and failed-attempt logs remain required evidence; root
removes them after those consumers finish. Disposable build/browser-output and
task caches are removed after processes/readers finish; cleanup receipt records
exact paths and failures. Shared caches and original checkout remain preserved.

Independent final browser QA: ADEQUATE; all4terminal reports and exact full saved
objects independently checked, both mobile Defense screenshots inspected, all
readers released. Disposable cleanup verified previewport60447closed, no active
task processes,7owned directories removed (44223941bytes),2planned paths absent,
remaining[]/failures[]. Exact receipt is included in compact machine evidence;
retained-artifacts.json at RAW enumerates every retained diagnostic file and owner.
Umbrella worktree claim continues for freshC1; no remote action.
