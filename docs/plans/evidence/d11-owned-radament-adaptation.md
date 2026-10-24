# D11 — Owned equipment adaptation for Radament

2026-10-24; runtime `1b937672fc4a8bd8b2ba85f175a273b57f252086`, local only.
Root diagnosis and exploratory continuation; independent acceptance pending.
No engine, content, skill, formula, resource or balance changes.

## Numerical diagnosis

Input is the unchanged retained attempt254 final, raw SHA256
`6ba04b90d68a5e5c8185289fa57e7fa0631e82e6d15fde9c0bf7c32f0dfc8974`.
Sorceress24/XP45612, Rogue23,5832 unique owned gear, next normal ordinal255.
Persisted120HP/102MP; no unspent stat/skill points. The previous draw remains
unchanged. Simulated rewards below never enter the campaign save.

A pure eligible-owned scan covers5824 hero/backpack/stash items; the eight
mercenary-owned items remain separately accounted. It is a candidate heuristic,
not an exhaustive attainable-build proof. A fixed32-seed production-engine
boss-wave screen starts both allies at native entry maxima, without preceding
wave costs. Each configuration gets every seed1–32 at ordinal255:

| Configuration | Wins /32 | Mean boss damage | Damage min–max |
| --- | ---: | ---: | ---: |
| Current priority/equipment |0|1233|858–1776|
| Ice Blast first |0|2665|2096–3508|
| Hero critical-hit gear |0|4605|3151–5961|
| Hero plus mercenary critical-hit gear |16|7401|5202–8977|
| Joint owned-equipment selection |17|7463|5508–8977|

Boss HP in this cohort is7836–8977. These are isolated optimistic wave inputs,
not native campaign clears. Hero equipment only improves eligible critical-hit
stats; weapon Attack does not increase Ice Blast. The old priority spends14
casts each on Frost Nova, Glacial Spike and Ice Blast; Ice-Blast-first produces
42 Ice Blasts with old gear. The critical-hit weapon reduces speed, producing40.

The initial mercenary candidate estimate incorrectly mitigated mean raw damage
before weighting critical hits. The one-damage floor makes this underestimate
physical critical-hit upgrades behind armor. The first128-battle screen is
retained; it selected no merc upgrades and cannot support a strongest-build
claim. The corrected scorer separately calls production `mitigateDamage` for
normal/critical estimates before weighting. Joint selection uses two fixed
actor orderings and two passes over weapon/amulet/rings, then picks its higher
stat-based score before battle sampling. It is neither a global optimizer nor
seed selection. No scenario patches skills or the engine.

The [versioned projection packet](fixtures/radament-owned-adaptation-screen/manifest.json)
retains the complete joint boss-wave and native full-area numerical rows.

## Frozen legal adaptation

Every item below is already in the retained earned backpack. Normal native
hero/merc equip actions are required; no item creation or socket changes.

| Bearer | Slot | Owned item ID |
| --- | --- | --- |
| Hero | weapon |`it-70ybu-34o`|
| Hero | amulet |`it-1asp1-30z`|
| Hero | ring-left |`it-4iwhi-3gb`|
| Hero | ring-right |`it-32obf-352`|
| Rogue | weapon |`it-1reh4-39r`|
| Rogue | amulet |`it-5ooup-3rg`|
| Rogue | ring-left |`it-4oey0-47v`|
| Rogue | ring-right |`it-6bceo-2xl`|

Retain other equipment, all allocations, the same fielded Rogue/formation and
her priority. Move Ice Blast above Frost Nova and Glacial Spike. Expected hero
568maxHP/310maxMP, speed125, crit25%×3.08. Expected Rogue378maxHP/189maxMP,
Attack210/speed202, crit21%×2.69. Preparation retains120HP/102MP; only native
entry starts combat resources at maxima.

## Native full-area projection

Use production `restoreEarnedSave`, actual `equipItem`/`equipOnMerc`,
`startEarnedRun` and complete recorded playback/settlement. Both cohorts start
from identical original earned inputs and consume native ordinal255→256 within
isolated service stores. Native carry, ordinary loot, XP and leveling remain;
none of these simulated states is promoted to the campaign.

| Cohort | Seeds | Full-area wins | Nonwins | Winning boss TTK p50 / p95 |
| --- | --- | ---: | ---: | --- |
| Screen |1–32|18/32|14|49.504s /57.460s|
| Separate holdout |33–64|18/32|14|55.692s /57.460s|

Across64, two nonwins terminate in waves2/3,26 at the boss. This is useful
attainability evidence, not the required cross-build boss win rate, three-try
adaptation policy, 30–50-hour pacing or C2 certification. The fixed configuration
is retained despite holdout failures; no favorable seed is chosen for real play.

## Actual ordinary-UI continuation

Production Chromium en360×640, unchanged current runtime, Date pinned to the
input timestamp with native timers. No bridge, Skip, speed change, private store
writes, extra farming or balance edits. Exactly one attempt255 is authorized;
stop on first nonwin/refusal/error and keep genuine prefix rewards.

Setup1 applies all eight transfers and exports each. It stops before combat
because the harness expects3 priority rows while the UI pads to9 with empty
slots. This is a harness assertion error, not a product defect. Zero launches;
normal ordinal remains255. Preserve that original failed report. Setup2 resumes
its actual `stopped-export.json.gz`, raw SHA256
`1e56c300531060f443ad299884a355b6fceaa9f72134d4e876d45895fbd3f13f`,
without repeating transfers or restoring an older input. Two normal Up clicks
set the intended order. Prepared Save-close-Continue is exact.

One actual Enter consumes255→256. Waves1–4 win and grant14240heroXP,
140new gear,16989rune shards,31wishstones,one El and five gems. Wave5 is a
native draw: hero/Rogue survive, all four original mummies and one summoned
minion die, Radament survives. The failed wave grants zero XP/gear/merc rewards;
no area clear, quest completion, Claim or Book is granted. Critical hits are
observable, including340/365cold and278/290/348physical in the retained log.
Gear increases real damage but does not guarantee this boss win.

Final L24/XP59852 owns5972 distinct gear; every5832 ancestral item payload is
preserved apart from the declared equipment metadata changes. All allocations,
crafting/material-action receipts and the remaining equipment are preserved.
Persisted current120HP/102MP and the new maxima568/310 survive final
Save-close-new-page Continue. Next normal ordinal is256, Nightmare0; Radament
remains inProgress. Never reload the earlier input to repeat255.

The [retained final save](fixtures/earned-radament-attempt255/retained-final.json.gz)
and [manifest](fixtures/earned-radament-attempt255/manifest.json) preserve the
actual continuation. Root self-audit validates14native saves, both prepared and
post-draw durable pairs, complete ancestral payload conservation and the
0-launch setup→actual resumed input chain. Source1076/build760/input4 frozen
hashes have no drift; all four production JS chunks are bridge-free. Zero
browser/page/console/diagnostic errors; the original setup assertion failure
remains recorded separately. This is historical earned continuation, not a
fresh-current-runtime campaign or ordinary-clock pacing measurement.

No balance values changed. The next decision must account for64native
projections and this actual draw rather than launch another blind retry.
The sample's56.25% full-area wins do not establish the required within-three
adaptation target. Full earned ActsII–V/C2, seven-class/213-skill/build/economy
acceptance, final pacing/PWA/accessibility/performance and C3–C4/G0–G7 remain open.

## Reproduction and retention

Raw diagnostics:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-radament-damage-kh5jm65l`.
`owned-scan.mjs`, original/corrected/joint `engine-screen*.mjs` and
`native-screen.mjs` consume the production Vite SSR modules and write named JSON
reports. The scripts have no persistent browser storage and select no real seed.
`browser255/` preserves the original setup failure; `browser255-resume/` owns
the resumed browser script, exact inputs, per-wave exports, frozen hashes and
terminal evidence. `artifact-ownership.json` tracks root ownership and cleanup.

Fresh production build uses `env -u VITE_E2E npm run build -- --outDir <owned>`;
repository `webapp-testing/scripts/with_server.py` manages preview4399 and its
exact child lifetime. Build is shared by setup/resume/audit until all consumers
finish. The exact disposable build is now verified removed, preview4399 is
closed, all task tool handles are terminal, and cleanup reports no remaining
disposables or failures. The task-only generator is also removed. Diagnostics
remain root-owned through unfinished
campaign/full-v1 consumers. Previous unchanged-runtime full unit11203/419 with2
existing skips, typecheck and lint remain prior evidence; this read-only runtime
experiment does not claim a new unit gate. Full private v1 remains active.
