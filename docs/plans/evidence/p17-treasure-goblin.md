# P17 — Treasure goblin equipment and material bundles

Verified locally, 2026-11-04, on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`
plus retained changes. Implements drop-tables §4.9 under
[D09](../decisions/D09-treasure-goblin-bundle-v1.md) and resolves BUG684 locally.
Constructed engine/native settlement evidence; no earned campaign, economy,
pacing or formal balance credit.

The configured live table grants five equipment picks at boss loot weights,
the existing additional rare-or-better item, independent1–4runes from the next
act (capped to V), and5–10gems from the actual act. D10 rune/gem caps and weights,
gear/offline MF, actual ilvl, current wishstone gate and shard formula apply.
Raw mixed TC content and explicit quest-cache interpretation remain intact.
Only the terminal equipment band extends to the supported finite122cap.

Native inspection found authored goblins are elite combatants and challenge
fitting cloned each into11–13enemies. Treasure waves now retain their authored
roster while ordinary8–20counts, elite promotion/affix draws, levels, source
metadata and idle pity stay intact. The goblin table supplies boss-tier reward
context without changing combat tier/stats. All three authored goblin areas
retain one spawn in manual/idle modes at ordinals0/9/12.

Missing configured loot data and incomplete equipment refuse the entire bag
before XP or inventory effects. Native Cold Plains publishes exactly six items
and concrete rune/gem stacks; publication failure restores all participating
domains and retains complete prepared reward evidence.

## Verification

Required packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p17-treasure-goblin-v1`.
Counts overlap and must not be added.

| Check | Result / retained evidence |
| --- | --- |
| Original real-pool reproduction |15failed, then40initial goblin/material passes; `original-failure.log`, `initial-green.log` |
| Actual encounter binding |7failed/38passed before correction, then45passed; `native-binding-red.log`, `native-binding-green.log` |
| Expanded boundary/planner diagnosis |9failed/143passed; five obsolete cloned-roster assertions and four incorrect new gem oracles; `boundaries-planner.log` |
| Missing configured source |One real refusal failure plus four gem oracle failures; `missing-source-red.log` |
| Corrected boundaries/planner |112passed; `boundaries-planner-green.log` |
| Native refusal/restoration and independent identities |61passed; `native-refusal-green.log` |
| Affected loot, seven files |164passed in5.08s; `affected-loot.log` |
| Final currency/planner/goblin/native selection, nine files |237passed in10.55s; `final-selected.log` |
| Scoped strict types |Pass; `types-final.log` |
| Explicit seven-file no-ignore lint |Pass; `lint.log`; one corrected undefined-oracle interpolation retained in `lint-initial.log` |
| Isolated production build / actual offline precache |Pass; `production-build.log`, `precache.log` |
| Forbidden bridge scan |All13emitted JS files pass five patterns; `bridge-scan.json` |

Final goblin file has35cases:15act/difficulty bundles; three-area combat/reward
binding; exact quantity/identity endpoints; independent identities and repeated
stack aggregation; MF/offline multipliers; fixed set/unique weights; finite
terminal-band eligibility; missing/invalid/unmaterializable data; schema/semantic
refusal; cache/unrelated-table isolation; complete deterministic bag/next entropy.
Ordinary planner core assertions were retained, replacing only treasure's
obsolete8–20cloning expectations. Boss gem weights start at normal, folded to
flawed only by Act I's cap. No test was disabled or weakened.

Local review found no remaining material issue within this slice. The loader
already removes zero-weight TC rows, so no additional runtime workaround was
needed. Security check passes: local bounded rewards and existing settlement,
without dependency/network/permissions/persistence/publication changes. This is
local verification, not independent umbrella approval. Existing chunk-size,
Browserslist age and optional art-manifest precache warnings remain; this does
not establish performance or physical-device acceptance.

All10source/test/data hashes match build inputs. All766build files matched
their SHA256 manifest before exact disposable `production/` and
`types.config.json` removal; absence is verified in `cleanup.json`. All task
processes are terminal; no server started. Root retains the required packet
and claimed human2 checkout through umbrella review and owns eventual cleanup
and release.

BUG684 is resolved locally. Full P17/privatev1, remaining intended-build
viability, economy/pacing and wider integration remain open. Counts stay14ActI
clears/3five-act Normal completions/formal0of210. No full suite, campaign replay,
new agent, install, commit, push, publication or training-budget renewal.
