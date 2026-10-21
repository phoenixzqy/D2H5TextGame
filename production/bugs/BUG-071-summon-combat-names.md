# BUG-071 — Localize supported summons in combat cards and logs

Status: fixed in `0e7a8ed`; bounded production-browser regression accepted at `bff2a70`.
Severity: Medium — mixed-language names; combat itself continues.
Owner: frontend/localization; root integrator, independent QA/GD/TD review.

## Reproduction

App commit `b8fa9e9baa6996f38076526c4c8879d61470835e`, clean production bridge/build
from C V3. Chromium Desktop Chrome profile,1280×800,zh-CN. Fixed Date
`2026-10-21T12:00:00.055Z` controls the existing production seed inputs; native
simulation/playback timers. No seed search or engine injection. Imported L6/two
points/Cap/resources are scaffolding, not earned progression.

1. Create a Druid, choose Chinese and import the reviewed eligible fixture.
2. Enter Blood Moor with an empty combo, pause, allocate Raven0→1→2 through UI.
3. Select Raven in combo slot1 and return to combat for native startup playback.
4. Observe the two summon messages after the localized cast.

Expected: `Paid Ravens 施放了 乌鸦。`, then `Paid Ravens 召唤了 乌鸦。` twice;
Raven cards and summon attribution use the localized summon name.
Actual observed DOM: cast is localized, but both messages say
`Paid Ravens 召唤了 Raven。`. Two distinct full-health Raven cards and the single
300→294/1000MP payment already pass. Subsequent Chinese layouts/font/save checks
were not reached. English passed the initial full browser flow.

## Evidence and cause

RAW root `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-summon-preparation-cijxqtry`:
`browser-summon-v2-report.json` (en pass/zh fail), original log/meta;
`browser-summon-v3-diagnostic-report.json` and `browser-v3-observed-startup.json`
retain the exact failed Chinese DOM frames. Diagnostic8.155s/exit1, no stops/signals.
V3 only moves the observer attachment before assertions; no oracle is weakened.

`src/stores/summonDisplayName.ts` resolves `combat:summons.<template>`, falling back
to the engine unit name. Both combat dictionaries lack raven, spirit_wolf, grizzly,
poison_creeper, carrion_vine, solar_creeper, shadow_warrior and shadow_master.
The skills dictionaries already contain these names; combat cards, new-unit name
maps and summon-log messages share the existing combat resolver. No engine defect,
resource-policy change or translation of unknown synthetic templates is needed.
Workaround: use English; no gameplay workaround required.

## Resolution and regression

`0e7a8ed` completes exactly eight missing names per existing combat dictionary.
Literal all18-template/both-locale tests cover explicit/legacy identity, card/log
consumers and unknown fallback. Actual unchanged-locale RED16failed/24controls
became identical-test GREEN40/40. Existing Blood Golem combat wording 鲜血石魔,
all other translations, resolver, runtime and saves are preserved.

Final production browser V6 passes both complete locale flows without retries,
24.377s runner; Chinese has one exact 乌鸦 cast and two 乌鸦 summon messages,
300→294MP and two distinct full-relative-life Raven cards. Native rank allocation,
explicit combo, whole-save reload and nine finite layouts per locale pass. QA
personally viewed all four final mobile/desktop screenshots. After the name fix,
separate font-environment failures were diagnosed and resolved with task-local
fontconfig/cache only; original assertions, source/CSS and shared fonts/caches
were unchanged. Original failed reports remain retained, not relabeled as passes.

[Complete evidence and regression mapping](../../docs/plans/evidence/d06-summon-preparation.md)
records exact source/build/environment freezes and limits. Imported L6/gear/points
are scaffolding, not earned/balance proof. This closes the supported-name defect;
full D06/P09, external-input summons and broader release gates remain open.
