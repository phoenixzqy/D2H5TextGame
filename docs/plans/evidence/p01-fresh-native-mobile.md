# Fresh mobile campaign stops at Dark Wood; C1 remains incomplete

2026-10-23, runtime head `8c6a4e7`. One fresh production Chromium attempt at
360×640 earns level 12 through ordinary UI, then draws at Dark Wood wave 4 of 5.
It stops at the first nonwin. Andariel and the remaining C1 exit were not reached.

## Actual progression and failure

The frozen route uses fixed Date 2026-10-20 12:00 UTC with native timers and
native area/time seeds and challenge ordinals. It creates a Sorceress, hires
the Rogue, earns exactly 40 Blood Moor first-wave wins, allocates earned points,
equips actual earned normals, clears Den, talks to Akara and claims the Den
reward once. The claim includes the real 375 mercenary XP. The bounded additional
Den preparation reaches level 12 after ordinal 101; 3,737 owned items have
3,737 distinct IDs. Initial normal preparation makes 11 actual transfers among
13 frozen choices. Nova 2/Ice Blast 8 and Rogue support priority are selected
through their ordinary controls.

| Native challenge | Actual result |
| --- | --- |
| Blood Moor, ordinal 102 | 3 victorious waves |
| Cold Plains, ordinal 103 | 4 victorious waves |
| Burial Grounds, ordinal 104 | 4 victorious waves |
| Dark Wood, ordinal 105 | 3 victorious waves, then wave 4 draw; wave 5 not launched |

The Dark Wood seed is `4003329104`, generated from its canonical area and date.
It differs from the earlier service route's explicit shared seed `2223645302`.
The failing wave contains 12 level-13 monsters. At the 60-second draw one
champion Dark Stalker B remains at 19.73% HP; hero HP is 93.89%, Rogue HP 93.85%,
and hero mana 175. This is a throughput limitation in this observed encounter;
it does not establish a damage-formula defect or a survival/resource failure.

Across preparation and progression, retained terminal snapshots show 302
victories and one draw. The final full export equals the preceding wave-3
export exactly: no observed failed-wave XP, items or currency. All 3,875 owned
items retain distinct IDs. Dark Wood remains uncleared. No reward-gear boundary,
Catacombs, Andariel, Sisters claim, Coif equipment, Act II unlock or final
Save→close→Continue was executed. None of those pending assertions is a pass.

## Provenance and independent review

[Compact terminal evidence](fixtures/p01-fresh-native-summary.json) binds the
actual outcome, report, exports, plans, wave awards and hashes.
[Exact browser script](fixtures/p01-fresh-native.spec.ts.txt),
[configuration](fixtures/p01-fresh-native.config.mjs.txt) and
[pure gear helper](fixtures/p01-fresh-gear-helper.mjs.txt) preserve the frozen
execution. The external scripts include absolute paths for the recorded local
run; the sibling package manifest selected ESM. No import, direct store/storage mutation,
debug bridge, injected seed/ordinal, forced drop or gameplay retry was used.
Readonly observations/export downloads and the pure plan/gear oracle do not
mutate gameplay. Only ordinary Skip/Pause/Flee controls advance the route.

The production build used VITE_E2E unset. All four JavaScript chunks passed the
repository's five forbidden-bridge patterns. Independent QA verified all six
execution-freeze entries, 1,346 source-provenance files and 760 build files
before the later independent CSS edit: no mismatches. Browser errors, retries,
skips and flaky outcomes are zero. The single browser case failed on the real
draw, not an erroneous expected reward. Run duration was 709.10 seconds.

Independent QA: **ADEQUATE for the retained failure evidence; C1 INCOMPLETE**.
The failure export, award absence, unique ownership and unreached checks were
independently verified. All QA readers released. The unchanged source's prior
8,546 unit tests/typecheck/lint remain inherited evidence for this campaign;
this browser outcome does not convert them into campaign acceptance.

## Next bounded work

Producer recommends auditing the safe upgrades already earned by the end of
Burial Grounds under the existing score/tie/ownership policy, to assess moving
the sole reward-gear boundary before Dark Wood. This is a preparation candidate,
not approval to tune combat stats or claim a future victory. Preserve this
native seed, original failures and BUG091 whole-item exclusions. No gameplay
continuation, replay, stronger farming or alternative-seed search follows from
this report. The separate BUG092 button target repair requires focused mobile
validation and does not require repeating this campaign.

That [pure audit](fixtures/p01-pre-darkwood-gear-audit.json) is now complete.
The genuine post-Burial save has 3,862 unique owned items. The unchanged selector
freezes 15 choices and seven legal direct swaps, conserving every ID and all
nongear state/resources. Projected hero Attack 56→78, Attack Speed 125→135 and
Defense 120→122; Rogue Attack 43→80, Attack Speed 122→137, Defense 77→111 and
maximum HP 244→269. Unsupported critical/dodge-bearing items stay excluded and
owned. No combat was run. This supports an earlier-boundary candidate for the
next frozen route, without predicting or establishing victory.

## Independent mobile repair — BUG092 accepted

Commit `6e2eb30` changes only the candidate Equip button's local minimum height
from 36px to 44px. The old computed height was 40px, correcting earlier shorthand
that called its declared minimum the actual size. Shared Button behavior,
ordering, localization and state actions are unchanged.

The [exact focused browser check](fixtures/bug092-target.spec.ts.txt) and
[configuration](fixtures/bug092-target.config.mjs.txt) import the genuine L6
prepared checkpoint through ordinary Settings controls. This is presentation
and transfer proof, not fresh acquisition. One baseline case fails on the real
40px target. All ten final en/zh-CN × 360×640, 412×915, 640×360, 1280×800 and
1920×1080 cases pass in 100.08 seconds, with zero retries/skips/flaky outcomes.

Every case measures all 142 Gloves-picker buttons at 44px height; widths are
87.21875px English and 72px Chinese. No horizontal overflow; keyboard equipment
activation, exact whole-save transfer equality, Save and reload pass. The
[machine summary](fixtures/bug092-browser-summary.json) records every case.
[English](fixtures/bug092-target-en360.png) and
[Chinese](fixtures/bug092-target-zh360.png) screenshots support the layout.

Actual final source validation passes: 8,546 unit tests/273 files, typecheck,
lint and a VITE_E2E-unset production build. Unit duration 176.83s exceeds the 15s
test budget. All four JavaScript chunks pass the five forbidden-bridge patterns;
the existing build warnings, including the unprecached large asset manifest,
remain. Producer source APPROVE/security PASS and independent QA ADEQUATE cover
this scoped repair. Frozen harness/source and all 760 build files match. No
physical-device, full accessibility, performance or C1 completion claim follows.

## Retention and cleanup

Root retains the exact failed exports, ordered awards, native DOM observations,
screenshots, scripts and provenance through the umbrella C1 consumers at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-fresh-act1-native`.
Root removes disposable output after all readers/processes finish; the cleanup
receipt enumerates removals and failures. The [native cleanup receipt](fixtures/p01-fresh-native-cleanup.json)
records 782 files/42,311,269 bytes removed; the
[BUG092 receipt](fixtures/bug092-cleanup.json) records 871 files/42,144,554 bytes.
Both have remaining disposable paths `[]` and failures `[]`; all tracked handles
are terminal, the preview port is closed, and all readers released. Native
failure screenshot/error-context evidence was copied with hash bindings before
disposable Playwright output was removed. Shared caches remain untouched.

Root also retains focused measurement scripts, logs, reports and screenshots at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-merc-equip-target`, and the
three required pure-audit handoff files at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-after-burial-audit-83dpqT`.
They remain for C1/umbrella consumers; root will remove them after those consumers
finish. The latter has no remaining helper/cache/process artifacts. Retained
file manifests at both root-owned diagnostic directories bind exact files.
No remote action; full v1 remains open and the umbrella worktree claim continues.
