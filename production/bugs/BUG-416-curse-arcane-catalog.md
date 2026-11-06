# BUG-416 — Generic fillers hide curse/arcane signatures and ordinary damage

Status: bounded five-row repair implemented and verified locally;
earned campaign/balance and listed payload/identity gaps remain open.
Severity: High. Owners: content-designer/engine-dev; game-designer/QA.
Environment: HEADb5a0898+private-v1 local work, Node24.21.0; pure native engine,
factory7/battle13, locale/viewport independent.

Reproduce: bundled Ghost/Wraith/GreaterMummy/HoradrimAncient default registry
against passive unmitigated tank selects generic CD1melee every action,
suppressing Curse/Rift/Breath. Knight uses Spirit but generic fills gaps.
All five omit explicit ordinary Attack/growth pairs.
Expected: preserve native signatures/order, expose true ordinary cooldown gaps
and author provisional light/standard/agile curves in P15-curse-arcane-family-v1.
Actual: fixed generic payloads hide role skills and progression. Root cause is
BUG087 upstream authoring/action-source gap. No selector or payload workaround.
Curse/Amplify, Rift/ManaBurn, fixed Spirit, poison-cap and missing thematic
mechanics remain explicitly documented; this repair does not accept balance.


Initial native RED:29intended source/list/curve/action failures,4passingcontrols,
33cases/9.555swrapper. All eleven ordered roster/source assertions reach intended
curve/action failure; exact Izual source/roster also reaches intended Knight
curve failure. External static-v1 PASS0diagnostics. Preflight found a test oracle
error before freeze: Wraith ManaBurn arcane combos do not amplify physical;
ordinary must87, not130. Ghost Curse may miss; permit74/111 while positively
requiring111. Corrected before baseline, no production/source skill change.

Preflight APPROVE/READY after corrections. Before capture, root also separated
native raw Curse event alias(amplify) from canonical stored status(amplify-damage)
and positively pins canonical3000ms expiry. External recipe/driver now frozen;
exact baseline metadata/specs/controls/source/normalization/replay ownership pass.

Post-adoption green-v1:327PASS/1FAIL across3files,11.748swrapper. Only mixed-pack
oracle assumed first two Mummy swings were landed noncrit; native seed13excludes
those swings. Keep seed and native RNG, use independently derived landed clocks
5820=256(Ignite+Amplify),11640=205(Amplify),13580=171(Ignite), proving both effects
and expiry. Test-only repair; no production/driver/recipe change or arm rerun.

Post-compare affected-v1 exposes one older stale priority oracle: Knight still
expected StrongMelee in its cooldown gap. Add Knight to the existing authored
ordinary expectation, preserving all signature endpoint/impact/dodge/replay
assertions and remaining controls. This one-string test-only repair follows
completed matched capture/compare; no production/driver/recipe change or rerun.
Exact before/after hashes retained separately in packet stale-priority-repair-v1.


## Final bounded result

Five lists/curves adopted; all other monster/runtime/payload/schema/locale fields
preserved. Inventory83authored/28pending; all111numeric acceptances unaccepted.
Final18files/822PASS(28.465s), strict types-final-v2 PASS10.698s, scopedlint-v2
PASS8.929s. Independent implementation QA APPROVE, evidence audit found no
material inaccuracies in2400pairs/600controls and all24cells. All owned wrappers
exit clean with no live descendants; exact arm caches absent. Historical failed
attempts retained; no matched arm reruns.

Fixed2400fights/arm:405/961/1034wins/losses/draws→237/1363/800.234draws and168wins
become defeats;600unchanged control inputs/recordings/metrics exact. Material
threat increase, not numerical/earned acceptance. Native Curse/Rift/Spirit,
poison-cap, missing thematic identities and covered Greater/Horadrim caveats
remain explicit. Complete cells/hashes/corrections/ownership:
[evidence](../../docs/plans/evidence/p15-curse-arcane-family.md).
