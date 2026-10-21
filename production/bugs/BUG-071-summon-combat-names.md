# BUG-071 — Localize supported summons in combat cards and logs

Status: confirmed; fix pending.
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

Pending: complete the two existing combat summon dictionaries with the eight
existing bilingual names. Freeze literal tests for all18 supported template names,
explicit and legacy IDs, both display/log consumers and unknown fallback; execute
actual unchanged-source RED before adding locale entries. Keep existing blood-golem
combat wording and all other translations, unknown fallback, runtime/save unchanged.
Production Chinese Raven startup and both complete locale/browser flows must pass.
