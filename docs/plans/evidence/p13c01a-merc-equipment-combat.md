# P13c01A — Mercenary equipment in fresh combat

Date:2026-10-20. Inputd8f1c23. Root developer review ADEQUATE; independent
producer/QA final APPROVE; evidence ADEQUATE. This is the
bounded runtime authority fix for BUG046, not browser/Den/fullP13/C/G acceptance.
Controlling contract: [decision](../decisions/P13c01-merc-equipment-combat-authority-v1.md).

## Cause and resulting behavior

Successful merc transfers save canonical mercEquipment separately. Fresh-run
construction previously passed only the merc baseline, so cap defense6 left
defense26 and sword attack7 left attack25. The caller now selects the owned
fielded merc and its gear from one snapshot. The adapter uses a pure projection
that adds shared equipped-minus-bare formula deltas over saved grown stats.
It returns fresh stats/resistances, preserving all zero-delta values exactly.
No saved projection, growth/schema/eligibility change, accumulation or RNG draw.
Changed speed receives finalfloor1. Changed maxima clip saved projected currents;
unchanged maxima preserve even legacy overflow. Fresh unit top-level pools still
start at effective maxima, consistent with existing run policy.

Only fresh runs compose. Swapping/removing gear leaves recorded input/events
and carried stats/current resources intact; the next fresh run sees new gear.
Named Basic Arrow retains registered15–25; attack gear improves basic fallback
only. Merc MF/GF projects, but current rewards still consume hero values. There
is no new weapon metadata, socket/runeword/percent scaling, healing/resurrection
or claim that gear omission caused the archived Den loss.

## Test sequence and independent review

BUG046 preceded runtime edits. Initial3-case RED had one genuine sword failure
and a cap fixture typo (`inventory.items` instead of `backpack`), one control.
Only that property was corrected; corrected3case RED has two genuine failures
and one control. Original source/reports retained for independent review.
Expanded freezes separate helper's missing API from nine real adapter/caller
stat/damage failures. Prior35case RED had32failures/3controls,0pending; TSC/lint
then caught only exactOptionalPropertyTypes/redundant type narrowing in tests.
NonNullable baseRolls, ignored empty signature string and a retained missing-event
guard corrected those fixture types without changing numeric assertions.

Design's original removal oracle contradicted zero-delta preservation: original
S.current180/85,max172/79 must return helper current180/85 with no gear, not
172/79. Producer/QA independently required the correction before implementation;
fresh adapter pools remain172/79. Separate negative-gear case proves clipping.
Root and QA then required a noncanonical saved crit/MF/GF/resistance baseline,
closing replacement-by-G coverage. Producer/QA independently approved final
36case RED (24missing-helper +9genuine failures +3controls,0pending) before any
runtime edit. Frozen assertions stayed unchanged through the first36GREEN.

Source review independently found a compatibility edge in the first fix: find
alone could select owned id empty string where prior getFieldedMerc returned
null. BUG046 recorded it before correction; an appended regression passed the
old-getter-null assertion but failed actual hero+merc versus hero-only team.
Both reviewers approved37case RED (36pass/1fail) before restoring the falsey
guard using the same snapshot. Original36assertions are intact.

First related run649/650 passed; sole failure was prior Acolyte test requiring
reference identity with saved stats. Full values were identical, but this
contradicted approved fresh-copy ownership. Both reviewers approved replacing
only Object.is with full deep equality plus stats/resistances nonalias checks.
All actual164/102/114/1588ms/heal43/loadout/determinism/immutability assertions
remain unchanged. This stale oracle is the sole justified sixth code file.
Final focused38/3 and related651/53 pass,0pending/todo.

Pure helper cases cover rich all-field deltas, persisted base/modern affix/unique
rolls, distinct set thresholds with duplicate-piece stats, zero/null/unsupported
gear, caps199/499/501, speed floor, resource/legacy boundaries, repetition and
isolation. Store cases use real factory/growth/transfer/combat/recording/damage
consumers, canonical-map decoys, stale callers, current-fielded selection and
next-run/removal/carry. The wave finisher/resources are labeled synthetic and
make no earned-state or balance claim. Lightning70 yields44→38→17; actual
seed0 Basic Arrow remains15→15 while fallback25→32.

## Current-head validation

Linux, Node24.21.0/npm11.19.0, Vitest1.6.1. No browser claimed in A.
Full unit/coverage2445/142 allpass,0pending/todo,42.290s. Engine1011/52 passed
6.174s after helper edit; no later helper edits. Final related651/53 passes
29.282s, focused38/3 passes4.154s; TSC18.226s/lint39.037s pass. Purity scans52
engine test files. Production guard runs native Vite build with VITE_E2E unset:
pass8.832s, four emittedJS chunks have no testbridge symbols. Build ran only
after full coverage/fingerprint tests finished. `git diff --check` passes.

Coverage across64engine modules:8169/8649 statements/lines94.45%,1927/2138
branches90.13%,299/318functions94.02%; unchanged80% thresholds allpass. New
helper64/64statements/lines,13/13branches,3/3functions100%. Engine3s/related5s/
full15s timing budgets remain exceeded; no threshold/budget was weakened.
Existing stale Browserslist, >500kB main chunk and2.57MB art-manifest excluded
from precache warnings persist. Broader performance/PWA/fullv1 gates remain open.

## Exact evidence inventory

RAW=`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-merc-gear-p_il1gto`.
All test/type/lint/build commands ran from claimed human worktree2. In argv
below, literal `$RAW` substitutes that exact prefix for readability, not an
environment variable used by the recorded commands. Wall seconds are runner
measurements; metadata records exits and actual argv. Failed attempts remain
explicit. Reports, original/frozen sources and logs were retained until all
independent consumers finished; the hashes remain durable evidence after cleanup.

| Step | Recorded argv | Exit | Wall seconds | Log SHA256 |
| --- | --- | ---: | ---: | --- |
| initial-red | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "--reporter=json", "--outputFile=$RAW/initial-red.json"]` | 1 | 4.384 | `d9b93bd53f93c35e51a39818e52516a9dd463ccc16351c5f20ab212ce1ea11d3` |
| repro-red | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "--reporter=json", "--outputFile=$RAW/repro-red.json"]` | 1 | 4.193 | `26f5e64732ddb90794e23ee384f0279165261a02297b1067edc5d34c6d95c089` |
| authority-red | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "--reporter=json", "--outputFile=$RAW/authority-red.json"]` | 1 | 4.336 | `4dcd38f92adf6bef4d251bcf27f46e971f456369977a35be11f757e21ecee6aa` |
| helper-feature-red | `["npm", "run", "test:engine", "--", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/helper-feature-red.json"]` | 1 | 1.718 | `c93cf033d7f52f4719dcdbc4214c4ae7d0d6fbe6b7b7ce865c9299922b55945f` |
| resource-feature-red | `["npm", "run", "test:engine", "--", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/resource-feature-red.json"]` | 1 | 1.718 | `42fd8988a3220f48ad8eefbc9df7555fc2765d6206f515356322603c054dd3bf` |
| expanded-helper-red | `["npm", "run", "test:engine", "--", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/expanded-helper-red.json"]` | 1 | 1.754 | `70500b1f6ea0fffeb56d9d002fbd8ab928b083f2362e0891678390a55c69fa55` |
| consumer-red | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/consumer-red.json"]` | 1 | 4.365 | `eacfb95bb225b67fe854beb476458a10ab22265ad6443378007f1cdf293da84d` |
| frozen-red | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/frozen-red.json"]` | 1 | 4.366 | `d55b813407a414a535e1567a56e47d3b52819426aaad89e6dd5319d8703bb62f` |
| red-scoped-lint | `["npx", "eslint", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "--max-warnings=0"]` | 1 | 5.298 | `5bdb6db06a00c51ed0d622c4891d68573672aa3d9eefa279098c731d12f31b00` |
| red-typecheck | `["npm", "run", "typecheck"]` | 2 | 9.879 | `30fb8a1f3b214357c7e377d3fb74ffcfdd4ce49c05f727f74c6b25369f543572` |
| typed-red | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/typed-red.json"]` | 1 | 4.806 | `f15fb144d6bf49ac224d8f434cb242fc737888217dce9d0d4e39ac7381a41774` |
| typed-scoped-lint | `["npx", "eslint", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "--max-warnings=0"]` | 0 | 5.887 | `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855` |
| typed-typecheck | `["npm", "run", "typecheck"]` | 0 | 10.715 | `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47` |
| amended-red | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/amended-red.json"]` | 1 | 4.456 | `b7f8c2c5fd4848a5a76bcfe553460901fd0569a82221dc60813af515052e547d` |
| helper-engine-green | `["npm", "run", "test:engine", "--", "--reporter=json", "--outputFile=$RAW/helper-engine-green.json"]` | 0 | 6.174 | `e9850166863b302bb4f5e8757f8ec0beb7aeee7df7dbb2ba009717ae547b54e1` |
| frozen-green | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/frozen-green.json"]` | 0 | 4.143 | `5f2ed85cf126910a3aab8574766e01c7e2a357802201276ebf333697ae0c74ee` |
| runtime-typecheck | `["npm", "run", "typecheck"]` | 0 | 10.409 | `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47` |
| related-green | `["npm", "run", "test:related", "--", "src/engine/progression/merc-equipment-stats.ts", "src/stores/mercToCombatUnit.ts", "src/stores/combatHelpers.ts", "--reporter=json", "--outputFile=$RAW/related-green.json"]` | 1 | 27.782 | `3a3576026a947e5d0950bea6774627336c7c1ebe6f4bd9b4117bc5f42ffcfc32` |
| runtime-lint | `["npm", "run", "lint"]` | 0 | 38.000 | `290646fe97e8078bf27d8734f7036ca6e50994d3ba01e473b96d9223ccd41697` |
| empty-id-red | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "--reporter=json", "--outputFile=$RAW/empty-id-red.json"]` | 1 | 4.609 | `ff12cbc8ae564af7d2a48d87d83d6d0cf7e54ca353ef34d3ba1294ad890719e5` |
| reviewed-green | `["npx", "vitest", "run", "src/stores/merc-equipment-combat.test.ts", "src/engine/progression/merc-equipment-stats.test.ts", "src/stores/merc-healing.test.ts", "--reporter=json", "--outputFile=$RAW/reviewed-green.json"]` | 0 | 4.154 | `e5abe105f676b642400d8e1c2c2f28bfd8075afa7cccdd823e3ee48d66750694` |
| final-typecheck | `["npm", "run", "typecheck"]` | 0 | 18.226 | `53a6aa8b4a16237ddc596024409b40a8c8e29e9056c6757c6f5c4fba3b0a7f47` |
| final-related | `["npm", "run", "test:related", "--", "src/engine/progression/merc-equipment-stats.ts", "src/stores/mercToCombatUnit.ts", "src/stores/combatHelpers.ts", "--reporter=json", "--outputFile=$RAW/final-related.json"]` | 0 | 29.282 | `0eadbc245f5f443cdef97a8b0bbb54a6ac5a028e0277bdc54232dd9186076312` |
| final-lint | `["npm", "run", "lint"]` | 0 | 39.037 | `290646fe97e8078bf27d8734f7036ca6e50994d3ba01e473b96d9223ccd41697` |
| final-coverage | `["npm", "run", "test:cov", "--", "--reporter=json", "--outputFile=$RAW/final-coverage.json", "--coverage.reportsDirectory=$RAW/coverage"]` | 0 | 42.290 | `f25b3c1c2271db16724417314d05afadd7cd15bbe9d75340eda98f48c53abb38` |
| production-build | `["npm", "run", "check:test-bridge-shake"]` | 0 | 8.832 | `40156c95bb19396ac051f5207dca8fda5373b1926c177e546bacbe328e71dc8c` |

| Report | Total/pass/fail/pending | SHA256 |
| --- | --- | --- |
| initial-red | 3/1/2/0 | `a43c1bf1a76d090bc5b2e50f25f7e8d3b965c835bc6901fdd42c531146fec773` |
| repro-red | 3/1/2/0 | `81eb9d9e4a784379d4162ee29099a15c3e60c5bdb2448a1639691136c190d91f` |
| authority-red | 7/1/6/0 | `4dab7c20775e9125b02e9889c801a36bf29ffd1e266dffef7480b9b90e5d7ebd` |
| helper-feature-red | 7/0/7/0 | `d45a9057fefc60f69b703e7c4f33acccc82d09e8dc4e4153001542015292a89f` |
| resource-feature-red | 18/0/18/0 | `b55c2d5aae20abdd1a58fdadca3f139e6d99741924304d6a2a5b5aedc8d73f50` |
| expanded-helper-red | 23/0/23/0 | `34b0bb8b8c2d90573f343e51eb3e1f508518cdf5bd2162c1a2f458c769b828cc` |
| consumer-red | 33/2/31/0 | `cd6d71ddb10f515552a2aac36fe4686c52d4adcb6fb7bcabdec3d7fc9815f397` |
| frozen-red | 35/3/32/0 | `c6387eb9f53b233824f6c74c7b92c0af5d4f1bf444e52a20f4aac24e5570ee0e` |
| typed-red | 35/3/32/0 | `fa989b02d930526e0422558b4bd2f6576e86d164e2664a74a5766bda15790567` |
| amended-red | 36/3/33/0 | `7590fc6a17bcf8efc5b5c40a9779410bb30a74c0a1346d732019db21a4ed1f33` |
| helper-engine-green | 1011/1011/0/0 | `f69484bf3b47d195d8e3e144f1d22243bc4c48e42eb6ccb2200cba47d9e08d73` |
| frozen-green | 36/36/0/0 | `21fcd9cabe2ec8adf690afc0fbfbf27a471cf169b135e1cf3c3c8e2f31b339f1` |
| related-green | 650/649/1/0 | `4c4065a20a4075d970e0efad7efe4183c10fd514a5789cf1fbd2e8f6b42e2065` |
| empty-id-red | 37/36/1/0 | `6c268d0d813d30a8c15cea289544ffbc65a54786e8b53496a740b60fe93b78c6` |
| reviewed-green | 38/38/0/0 | `dfa40c8cd461bdcb62d8430e68bd26d0ad67f212babb85eb97912a3b8cecef9f` |
| final-related | 651/651/0/0 | `a53d5c8aa6a365b9e8e66434dd93802f55b784bbd7496435429cbea6d1a9ee95` |
| final-coverage | 2445/2445/0/0 | `da48220d4b76601c637017e90a66969c3f9b9beb21143e8c3c5f9e1b6153be5e` |

| Final code file | SHA256 |
| --- | --- |
| src/engine/progression/merc-equipment-stats.ts | `ae9c6388598763707d930a7218cfcab125d7104ee373e453890c5cc78393dfa0` |
| src/engine/progression/merc-equipment-stats.test.ts | `aa8435710cad33e5bb4f563d444b3f08d4fffac7a7a59955490b553f94ab3166` |
| src/stores/mercToCombatUnit.ts | `e44d4127636f51799b143886a5c0502054e4e03cb293d890809aef734f6f29f7` |
| src/stores/combatHelpers.ts | `e32016214adaae76ce8216f711667e80b594d7b90176f6d70d6ee4012fcf0308` |
| src/stores/merc-equipment-combat.test.ts | `c552c4a18a8d541328e791fd10f1df9a5ba8afce560b4073b33b1e8d492a33e5` |
| src/stores/merc-healing.test.ts | `5dffa34ebc10d7ef6678b1aa95c5851c4f08dac8f5c67d47383c01ea36903570` |

## Sign-off and cleanup

Root developer: ADEQUATE for bounded A. Producer/QA independently approved plan,
final frozen RED, compatibility RED, healing oracle amendment and final source.
Both independent consumers released RAW retention after verifying all26command
rows/17reports/6codehashes and coverage. Root removed exactly RAW, worktree dist
and node_modules/.vite using resolved non-symlink paths; each absence verified.
No remaining A disposable paths or cleanup failures. No server/browser launched
in A; no task processes remain and no broad process cleanup was used.
Original checkout remains read-only, shared tools/caches/dependencies and all
source/history/worktree claim are preserved. No push/PR/merge/deployment.
Next B needs reviewed ordinary-earned/native-equip/combat/Save/reopen recipe and
browser proof. BUG047critical-damage display is separate. FullP13/Den/C0–C4/
G0–G7/fullv1 remain unaccepted.
