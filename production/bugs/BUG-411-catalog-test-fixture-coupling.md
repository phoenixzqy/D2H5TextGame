# BUG-411 — Decouple controlled integration fixtures from evolving monster actions

Status: fixed locally in14integration files; combined17files/247PASS.
Strict types/scoped lint PASS; full sweep terminal; all35initial failures covered by final focused PASS. Severity: Medium.
Owners: qa-engineer/engine-dev/frontend-dev.

Environment: private implementation worktree, HEAD b5a0898 plus the ordinary
physical and Fallen Panic changes; Node24.21.0, Vitest1.6.1/jsdom. Browser and
viewport independent. Blood Moor seed7/ordinal0 for store fixtures; lifecycle
test fixes Date.now to1792497600000 and uses its native seeded idle plan.

1. Run the ordinary full unit suite after the catalog action repairs.
2. Observe cross-wave recovery/poison, Frozen Armor and Concentration controls
   which replace `monster-weak-melee` in the registry.
3. Observe exact Skeletal Mage, corpse-count, poison-status and idle-retry
   expectations that also depend on current native monster actions.

Expected: synthetic poison/fire/stun controls actually create their declared
   effects before checking resource carry, defense or interruption. Native
   traces retain meaningful exact or causal assertions consistent with the
   adopted catalog. A lifecycle transition control establishes its prerequisite.
Actual: the removed generic skill is never selected by Fallen/ordinary rows;
   poison/stun/fire controls disappear. Several exact native traces also differ.
   Whether each remaining discrepancy is a stale oracle or production bug is
   still under investigation; no production defect is dismissed by this report.

Evidence: retained packet
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/`
`p15-panic-unit-full-v1{.log,-exit.json}`. The sweep is still running at intake.
Affected tests: `combatHelpers.{cross-wave,frozen-armor,might,skeletal-mage}.test.ts`,
`corpse-explosion-native.test.ts`, `poison-explosion-native.test.ts` and
`features/combat/CombatScreen.lifecycle.test.tsx`.

Cause established for injected controls: replacing a production registry ID
does not inject an effect once the production monster no longer selects it.
Use explicitly named fixture skills and a bounded test-owned action recipe
before real staging/recording. Preserve native damage, RNG, playback, save and
reward checks; do not restore obsolete production skills, mock random draws,
skip cases or weaken assertions. Native trace corrections need actual causal
evidence. Full sweep and targeted results will be appended after collection.


## Established causes and corrections

Explicit fixture skills now replace obsolete generic-ID injection for poison,
fire and stun controls at real staging; old MP/orb/carry/damage/save assertions
remain. Idle Retry's transition control now first establishes a native player
win/live hero with declared synthetic equipment. Refusal/time/identity/cursor
and exact delay checks remain. No production behavior was changed by BUG411.

Native Mage first bolts are[50,0,61,50], only Cold dodged. Both bilingual store/
component tests retain all resource folds, timer-driven UI playback and boundaries;
Quill Rat A now supplies exact DOT4+2+1=7. Second Mage wave has two actual finite
revivals at3640/7280, checked against original stats, FIFO corpse messages and
both complete death sequences; end7760/finalMP754. Independent mixed-Iron raw
recordings establish100MP end4852/final181 and56MP end4000/final168. Startup
payment/refusal, item debit, replay lock/identity, rearmed selection and no repeat
debit assertions remain. Cobra now follows the consumed charge's actual earned
clock, preserving payment/hit/gain order even when a later builder misses.
Corpse Explosion derives remaining count from real prior deaths. Poison Explosion
retains its native status/spread checks and exact target DOT sequence.

Raw lifetime diagnostics prove: Warrior dies1740 before its projectile lands;
restored Armor hero dies2500 before carried CD3400; Bone Armor228 is exhausted
by63+63+63+39 absorption. The controlled shadow fixture supplies an8second
observation window for hero/enemy actions and1000enemyHP, leaving native paid
summon stats/plans/ranks/rolls intact. Armor's held hero receives a declared
10000HP survival pool while preserving carried cooldown and actual new cast.
Bone's controlled Attack/attackRange1 chip preserves positive real absorption,
0<remaining<228, carry/replay and save-exclusion assertions. None is earned balance.

Lifetime3files/18PASS; Mage3files/6PASS in the retained diagnostic. Final combined
17files/247PASS43.802s, strict types PASS11.368s, scoped lint v2 PASS14.020s.
Independent lifetime and Mage reviews APPROVE without findings. All temporary
console diagnostics removed. Full sweep's old failures remain retained; it is
not a clean full-suite PASS. Exact logs/receipts and cleanup ownership are linked
from [P15 evidence](../../docs/plans/evidence/p15-fallen-panic.md).


Full sweep collection:1186files/25178tests,25143PASS/35initial failures in the
same14repaired files. Final17files/247PASS covers all initial failed files;
strict types v2 PASS7.733s. Aggregate evidence is reconciled explicitly, not
reported as a clean one-shot invocation. See linked Panic evidence.


## Doll affected-suite follow-up

The17-file Doll affected-v1 run also exposes the older delivery mutation fixture:
monster-rend is now an intentionally frozen authored signature budget, so assigning
its nested base throws before the mutation/reload authority oracle can run. This
is test coupling to the prior mutable stub, not a reason to unfreeze production.
Use the still-mutable native monster-strong-melee stub for the same nested-mutation,
reload rejection, restoration and restored-authority checks. Initial failure and
post-repair focused result remain in p15-doll evidence/packet. No runtime change.

Repaired-tests-v1 finishes114PASS/2files. Final native/resolver46PASS includes
corrected object-wrapped it.each candidates and specific rejection-error oracles;
prior array expansion could pass on unrelated TypeError. Strict types/scoped
lint PASS. Full correction/diagnostic/provenance limits: p15-stygian-doll-death.md.
