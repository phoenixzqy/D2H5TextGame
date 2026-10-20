# P08a04c — Ordinary-earned Frost Nova

Date:2026-10-20. Status: bounded browser child accepted by root/producer/QA.
Runtime13b5378 Frost A/B plus subsequent accepted prerequisites through297550a.
[Contract](../decisions/D04-frost-nova-secondary-v1.md). No runtime/data/locale
changes in this browser child. Fullskills/campaign/C0–C4/G0–G7 remain open.

## Discovery route and prior attempts

Use Date-only2026-10-20T12:00:00.000Z; native timers and ordinary controls only.
Fresh Sorceress owns Frost1/IceBolt1 but Frost requires6. Skills removes locked
Frost from combo and all9options without deleting learned rank or initialpoint.
Ordinarily hire free InnerSight, allocateFire1 with the initialpoint and configure
soleFire in all9slots. No stats/gear/Warmth or hidden grant; no storage writes,
game runtime imports or debug bridge. Exports are ordinary downloads, deleted
in finally. Observers attach before goto.

Exactly40 manual BloodMoor entries, fixedDate/ordinals0–39. Each wave1 must
show no living enemies and original hero alive, then wave2/Pause/Flee before
another award. Preserve all loot overflow; no discard/stash or loss fallback.
Source expected counts8+(ordinal mod13),554kills×20=11080XP. Independently
reconstruct cumulative XP from each saved level/XP pair. First39 remainL5;
40 givesL6XP67,next8818,statPoints25/skillPoints5 afterFire1. Gear staysempty;
currentlife120/mana102 preserved, caps160/122/attack32/defense35.

Scratch config lives outside repo and imports the production PWA config. Initial
scratch attempt failed before browser because raw directory lacked ESM type;
adding task-local package.json type:module fixes that tooling error. Next
attempt stopped at an underspecified5s SW wait; use the existing production
suite's60s activated-worker wait. No game change or missingSW acceptance.

The discovery-sw native run then passed all40 first-wave victories and final
source-derived level/point assertions. It stopped at Frost cast text because
character creation maxLength16 truncates input 'Earned Frost Nova' to
'Earned Frost Nov'. Snapshot includes actual Frost cast and C13cold→Chill→
Freeze→stunned. Correct literal to the actual16character name; this is a test
oracle correction, no runtime defect. Checker108.941s wall includes
this failure. All40 earned JSONs and final fullsave attached; root independently
recomputed cumulative XP for every saved pair and matched all40/11080.
Final inventory344items/5157rune-shards, no canonicalgear. Native survival and
progression are observed; complete Frost browser acceptance is still pending.

Refined discovery adds initial compact-card count each ordinal, actual saved
cumulativeXP each award, exact persisted ranks/combo/points, explicit ordinary
Unfield→Field and exported null fieldedMercId, whole soleFrost payloaddelta,
rank1 living C suppression/recovery log capture, DOM MP samples, ordinaryrank2
allocation, Save and real pageclose/newPage/Continue before actualrank2cast.
No source/behavior assertions are weakened; each prior failure remains recorded.

## Mana and status proof boundaries

Independent source oracle: ENG35×0.2=7MP/s,AS125 firstaction1500ms. FreshL6
mana102/max122 settles floor10.5=10 beforecast,112→92 forcost20. No earlier
scheduled recovery boundary. Preserve transient DOM samples; eventual MP after
AoE/orbs is not the cast debit. Both rank1 and rank2 share cost and schedule.
Hero actions1500Frost/3000basic/4500Frost; Quill1540/3080 andFallen1740/3480.
Freeze ordinary1000ms applies[1500,2500); no exact-browsermillisecond claim.

Require same identified living target hit→Chill→Freeze→stunned skip→later
normal action, plus surviving unfrozen control; record HP/alive at both phases.
Frost damage rank1 25–35/rank2 28–38,mana20,CD3s/all-enemies. Status playback
does not populate live badges; native logs retain raw [chill]/[freeze] names.
Engine evidence owns exact1000/500ms exclusive expiry, rank invariance, hit
probability/misses and10% distribution. Missing Chill slowdown stays deferred.
A Freeze log on a killed target does not prove action suppression.

## Validation and owned evidence

Discovery TSC9.300s and refined TSC9.666s exit0; explicit ignored-PWA lint
5.440s exit0 for earlier discovery source. Every native attempt uses production
check:test-bridge-shake and a Playwright-owned preview on4393; retries0.
The discovery results below are historical. The corrected assertion pilot
passes full Save/read-only DB/export/reopen and current-source validation;
the language/viewport matrix and independent final reviews remain pending.
Existing build warnings and unit/timing limitations from accepted runtime
persist; no runtime source diff.

Owned raw root:
/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-frost-earned-p2xoram_
Contains check.py, scratch ESM/config, result/log/report/decoded attachments and
browser outputs, including failed attempts. Keep until all consumers finish.
Task-owned dist and node_modules/.vite under the claimed worktree are retained
for this ongoing browser work; root owns exact cleanup and absence/port checks.
No shared cache/dependency cleanup or push/PR/merge/deployment.

Independent QA reconstructed all40 discovery-sw earned states and verified all
reporter/decoded bytes. Bounded progression discovery APPROVE/ADEQUATE only;
that native run overall FAILED1/retry0 on name oracle,107.695s runner/108.941wall.
Report SHA256da441f7da1657d5086fe7bebff8049966b9d7069c110423327767d2201dbb459.
FullL6save SHA2569118cbe5d9884beb0453588a645a00013887467dbed5a341c285f1d0be7ede47.
Source directmonstercount remains a refined-run obligation.

Independent design arithmetic, before final witness freeze: area/time hash gives
runSeed2330410254; wave1seed349193407 atordinal40 and newpageordinal0. Enemy
creation has a separate RNG. FallenA/B/C originalHP47/44/37,defense12,IDs
unit-card-enemy-act1.fallen-0-db2c / unit-card-enemy-act1.fallen-1-9804 /
unit-card-enemy-act1.fallen-2-4379. Rank1 cold15/14/13 leaves32/30/24;
rank2 cold18/17/16 leaves29/27/21. Allthreehit/noncrit. TargetFreeze draws
.11546456115320325/.3974823534954339/.07838152954354882 produce onlyCFreeze.
C positiveHP24/37=64.86% at rank1,21/37=56.76% at rank2. A/B are ordinary
unfrozen controls. Design calculation is source arithmetic; final native
observation still owns actual assertions/HP/action/reopen evidence.

Refined native attempt passed all40 direct monster-count and every actual
saved-XP assertions, then stopped at another test-only literal: ordinary unfield
button becomes 'Set as Fielded', not the draft shorthand 'Field'. Native failure
and MercCard/i18n source establish the correction. No game change. Overallrun
failed, checker111.956s; use corrected label before observing subsequent stages.

## Complete discovery and frozen acceptance candidate

Third native run is GREEN1/1,0skip/retry/flaky/unexpected/errors. Frozen discovery
spec1f93596a031c470894d26e633cebcc9646781e74d53c7958bd12c89ee398b0df;
report unfield-label-report.json SHA2568a1ca3f55ca4cb74e294865a5bac013851d605a0f48c608ff8f89a6c548d68d7.
Runner121.611/checker122.882s; case110.381s. All47decoded attachments match
reporter bytes, independently checked by producer and QA. Both APPROVE/ADEQUATE
Stage1 route/oracle readiness only. Root parsed both actual living C witnesses:
rank1 C13cold→Chill→Freeze→stunned→WeakMelee→1physical, positive24HP64.86%;
rank2 C16cold→Chill→Freeze→stunned→WeakMelee→1physical, positive21HP56.76%.
B is alive/unfrozen with30HP68.18% or27HP61.36%, Chill and normal action.
Actual DOMMP102→112→92 then94/99/103/106. Actual rank2allocation5→4, whole
Save and actualclose/newpage/Continue equality pass. Savedrank2 differs from
full earnedL6 only by fieldedmercnull, soleFrost combo, Frost1→2 andpoint5→4.
Ordinal40 has9enemies; newpageordinal0 has8, with the sameC/B identity/seed.

Final candidate strengthens initial automatic sanitizer BEFORE manual combo edits,
all40 literal counts/actual XP/stats/ranks/point/item/shard awards,344uniqueIDs,
ordered suppression/resumption phases with same target/controlHP/alive atboth,
exactA/B/C hits and MP112beforecast→92aftercast, readonlyDB/fullSave/exports,
locale/all9slots/bothpages SW/noBridge/nooverflow/errors and afterabort equality.
Native observations and independently derived constants are frozen without
runtime changes. Per-case180s is based on measured110.381s forty-wave route;
no performance-budget acceptance follows. Final candidate source review/pilot
and4case en/zh desktop/mobile matrix remain required.

Spec SHA256f7e272c3728054a201a49c06e703eb1420eb42d5eaad6c8e616875ec07258056;
config SHA256015418b6005daeb3428050226c67c7a4551d83955121175af772a994ac13d845.
TSCexit0/9.666s and explicitignored-PWAlint exit0/5.043s at these hashes.
Prior candidate lint required interface Sample rather than type alias; corrected
before freeze with no runtime change. Full lint/purity51 refresh passes
(frost-final-lint, exit0,26.073s). Independent producer and QA source review
APPROVE pilot readiness at these hashes; no browser acceptance follows yet.

Host Chinese font remains task-local: NotoSansCJKsc-Regular.otf from
https://raw.githubusercontent.com/notofonts/noto-cjk/main/Sans/OTF/SimplifiedChinese/NotoSansCJKsc-Regular.otf,
SHA2562c76254f6fc379fddfce0a7e84fb5385bb135d3e399294f6eeb6680d0365b74b,
16437364bytes. Temporary FONTCONFIG_FILE includes /etc/fonts/fonts.conf and
this root's font/cache; XDG_CACHE_HOME isolated. fc-list:lang=zh confirmsNoto.
Explicit installed PLAYWRIGHT_BROWSERS_PATH avoids cache lookup changes.
No app CSS/assets or shared font installation changes.

## Frozen assertion pilot correction

First final-assertion pilot at f7e272c/015418b failed1/1, retry0, after
all40 awards, rank1 phases, allocation, Save and actual close/newpage/Continue.
Rank2 A HP width expected `61.70%`, received `61.7%`; both encode29/47.
CombatScreen authors toFixed(2), but Chromium CSSOM drops the trailing zero.
The sole test delta changes this literal to `width: 61.7%;`, preserving the
numeric oracle and every assertion. Current spec SHA256
c6ead538cb9323236199ae03c07deb24d99174d1fdf5599a58b0cc061aeff678;
config unchanged. Reversing that literal exactly reconstructs the prior SHA.
Retained frozen-pilot-report.json and frozen-pilot-results preserve the failed
attempt: runner127.734s/checker129.295s. No runtime defect or behavior change.

Corrected pilot at c6ead538/015418b passes1/1,0skip/unexpected/flaky/retries,
runner127.978s/checker129.306s/case116.706s. Reporter cssom-pilot-report.json
SHA256d5b18e7d0ec6e5a58d3f402bb2ce325df092de68bea154ec62fbcdfc32ddf390.
All46attachments decoded under cssom-pilot-decoded; both exact living C/B
phase and MP112→92 assertions, all40 awards and complete Save/reopen pass.
Refreshed current-hash typecheck (11.494s), full lint including purity of 51
engine test files (27.994s), and explicit PWA lint (6.816s) exit 0, recorded
as frost-cssom-typecheck/lint/pwa-lint. The pilot
does not accept the four-case matrix or broader skill/campaign gates.

## Final production matrix

The unchanged corrected spec `c6ead538cb9323236199ae03c07deb24d99174d1fdf5599a58b0cc061aeff678`
and config `015418b6005daeb3428050226c67c7a4551d83955121175af772a994ac13d845`
passed all four cases on 2026-10-20. Report start: 13:33:38.790 UTC.
Runner: 245.820s; checker wall: 247.222s. Zero skipped, unexpected, flaky,
retried cases or reporter errors. Both pages in every case collect no browser
warnings/errors/page errors. Runtime source remains unchanged from `297550a`;
the latest runtime change is the accepted lifecycle prerequisite `3bd6911`.

| Locale | Project / viewport | Case seconds |
| --- | --- | ---: |
| en | pwa-desktop / 1280×800 | 116.907 |
| zh-CN | pwa-desktop / 1280×800 | 117.682 |
| en | pwa-mobile / 360×640 | 116.037 |
| zh-CN | pwa-mobile / 360×640 | 116.204 |

Exact matrix invocation, with RAW equal to the owned evidence root above:

```sh
env FONTCONFIG_FILE="$RAW/fontconfig.xml" XDG_CACHE_HOME="$RAW/xdg-cache" \
  PLAYWRIGHT_BROWSERS_PATH=/home/felixzhao/.cache/ms-playwright PWA_PORT=4393 \
  PLAYWRIGHT_JSON_OUTPUT_NAME="$RAW/cssom-matrix-report.json" \
  npx playwright test --config tests/pwa/playwright.config.ts frost-nova-earned \
  --output "$RAW/cssom-matrix-results" --trace off --reporter=line,json
```

The corrected pilot adds `--project pwa-desktop --grep ' en$'` and uses
cssom-pilot report/results paths. Each run builds through
`npm run check:test-bridge-shake`; Playwright owns the preview lifecycle.
Current-source checks: `npm run typecheck`, `npm run lint`, and
`npx eslint tests/pwa/frost-nova-earned.spec.ts tests/pwa/playwright.config.ts --no-ignore --max-warnings=0`.
Their exits and wall times are recorded above. No runtime change justifies
repeating the previously accepted full/coverage 2216 tests in 133 files.
That unchanged 80% engine gate passed with 8102/8582 statements,
1892/2105 branches and 296/315 functions; UI/store code is outside it.

Report SHA256: `ebf68131996590ab00bfa8937036edf843b2b5a1da2573b87607cd5737e06e72`.
Matrix log SHA256: `f934b64c22bdd49b6811a4affe6f57914e7db8a7b88942662f96d7592d89dcf3`.
Corrected pilot log: `ff4f1bb4ca4b0a012f273b215e340f7f0c238c8e2683e99229da8235c94268d9`.
All 184 attachments were decoded into cssom-matrix-decoded with byte/hash/size
manifest. Root independently reconstructed all 160 award records: each case
earns 554 kills, 11080 XP, 344 unique items and 5157 shards. Whole earned →
saved changes are exactly merc unfield, sole Frost combo, Frost rank 1 → 2
and skill points 5 → 4. All four saved payloads are identical after changing
only the locale preference to a common value.

Every rank phase has the same living C/B damage/status/action ordering and
HP percentages above. All eight MP sample sequences are
102 → 112 → 92 → 94 → 99 → 103 → 106; the cast debit is 112 → 92.
Root inspected English pilot and final Chinese desktop, English mobile and
Chinese mobile screenshots. Chinese text is legible. Narrow mobile unit cards,
truncated names, icon appearance and logs/lower rows below the fold retain the
existing BUG037/P16 usability gap. The screenshots do not independently prove
below-fold log ordering; literal phase attachments and native assertions do.

The matrix exceeds the four-minute local E2E budget by 5.820s. Existing unit
timing overruns, React test warnings, stale Browserslist data, >500kB chunks
and the unprecached 2.57MB asset manifest remain. Host NO_COLOR/FORCE_COLOR
diagnostics are separate from the empty browser console collections. No
exact browser-duration, probability distribution, Chill slowdown, whole-screen
UX/a11y, performance, full skills/campaign or C0–C4/G0–G7 acceptance follows.
Independent producer and QA final verdicts: APPROVE / ADEQUATE. Each separately
verified all 184 attachment bytes/hashes, all 160 progression records, all eight
living target/control phases and MP transitions, exact whole-save deltas and
the failed/corrected pilot evidence. Both finished all raw consumption and
released their retention holds. Root accepts only this bounded browser child.

After all consumers finished, root removed and verified absent the exact raw
root above and task-owned worktree dist and node_modules/.vite. Port 4393 is
closed; original checkout remains clean. Shared dependencies/browser caches,
source/history and versioned evidence are preserved. Root worktree remains
claimed for continuing the full v1 plan. No push/PR/merge/deployment.
