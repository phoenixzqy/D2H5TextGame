# Poison Explosion — bounded QA plan

Status: QA-PLAN APPROVE / ADEQUATE, 2026-10-22; implementation/execution pending.
Controls: [D06 contract](../../../docs/plans/decisions/D06-poison-explosion-v1.md),
[CE pool](../../../docs/plans/decisions/D06-corpse-consumption-v1.md) and
[D04 timing](../../../docs/plans/decisions/D04-combat-timing-v1.md).
Root owns implementation; QA reviews source, RED/green receipts and raw evidence
independently. No runtime/earned/balance/feel acceptance is granted by this plan.

## Deterministic setup and coverage

Use engine seed7 and literal zero crit chance, zero dodge stats and zero
resistance fixtures unless the case explicitly varies one dimension. Ordinary
hit chance remains85%; freeze an explicitly successful seeded hit for positive
coverage rather than assuming zero dodge guarantees it. Use production registry-loaded identity
for PE acceptance, not a replacement synthetic spell. Small synthetic ordinary
damage effects may isolate the shared status prerequisite before PE exists.
Run A/A and A/B/A without external counter resets, compare full results/events
and preserve deep-frozen inputs. Browser cases use fresh isolated IndexedDB,
fixed Date only, native timers/controls and state-driven waits; no hidden bridge,
state mutation or engine clock advancement. Record all losses and stop at the
predeclared experiment budget. Label imported scaffolding explicitly.

| ID / type | Setup and action | Independent expected outcome |
| --- | --- | --- |
| tc-pe-01 unit | Active three-stack marker, prior rate missing/0/negative/NaN/±Infinity; apply2.5HP/s at1700 | Four stacks, exact2.5 incoming rate/source, supplied type; original ID/start/unrelated payload/normal expiry retained, inputs unchanged; no RNG draw |
| tc-pe-02 unit | Prior positive0.25 or9; stronger/weaker/invalid/missing incoming rate | Prior exact rate/source/type retained; invalid incoming cannot promote an invalid old record; optional incoming type absence preserves previous absence/value |
| tc-pe-03 unit | Poison/Plague stacks9/10, Burn/Ignite4/5, Bleed1; promote at/below cap | Poison/Plague10, fire5, Bleed1; promotion works at cap, aliases remain one first-match bucket; later duplicate/unrelated records unchanged |
| tc-pe-04 unit | Active finite/longer-existing/indefinite/untimed clocks versus exact-expiry/future record | Active original start/max expiry/remaining preserved; inactive record replaced fresh with one stack; controls and paralyze RNG retain existing behavior |
| tc-pe-05 integration | Ordinary live damaging application onto marker at known scheduled action; separate fractional DoT before that boundary | Zero marker damage before promotion; no application-boundary free tick; integrate only subsequent elapsed time at aggregate rate, preserve previous fractional integral; exact final-expiry HP/event oracle frozen before implementation |
| tc-pe-06 unit/integration | Actual Player class/unlock17/18/Dagger/rank1,2,6,12,20; malformed aliases/projections; registry changes/sparse/extra effects | Only real exact authority qualifies; max valid alias without summing; independent literal ranked bases40–60/45–65/65–85/95–115/135–155,15MP/2s; invalid complete PE array disabled without disabling CE |
| tc-pe-07 engine | PE-only eligible battle, actual kill; empty pool versus no-PE order;14/15MP, cooldown boundary, no living target; all-dodge | Actual primary kill grants one; empty/invalid skips same action with identical fallback RNG/outcome and no cost; accepted all-dodge cast spends exactly one body/15MP/2s |
| tc-pe-08 engine | CE+PE in both priorities and eligible heroes; initial-dead/summon/orphan/duplicate/nonlethal/monster-tier controls | One shared FIFO; availability=qualified deaths−CEcasts−PEcasts; only eligible primary deaths count once; dead units/rewards retained. With19MP and[CE,PE], CE skips, PE spends15MP/one body, leaves4MP and CE cooldown unchanged |
| tc-pe-09 engine | Actual ranked PE versus fresh Poison, potency-free Dagger Poison, existing positive Poison; misses | A final ordinary hit40 gives2HP/s; marker promotion uses the actual post-combo final hit. For three Poison stacks, unmodified60 base→87 final→4HP/s and four promoted stacks→16HP/s. Existing1HP/s stays1; miss adds no status;5s/max10, exact expiry and lethal-hit order retained |
| tc-pe-10 engine | Lethal direct/periodic Poison/Plague; spread into marker versus damaging recipient; simultaneous deaths/final enemy | Existing half-stack min1 spread only to living same-side recipients after closure; promotion/retention applies; later casts can use new bodies; no recursive/free casts, duplicate death/reward or post-victory action |
| tc-pe-11 native integration | Actual Player composer through recorded combat; refresh/new wave, unlocked replay, Iron-locked replay and reward claim repeated | Plain/recorded equality, captured inputs immutable, wave pool empty; intended recomputation versus exact locked recording preserved; original resources and reward identities not charged/claimed twice |
| tc-pe-12 production E2E/a11y | Native allocate/priority/kill/PE/Poison HP+expiry/save/load in zh-CN and en at360×640,412×915,1280×800 | Correct PE-specific consumption copy; truthful rank/cost/CD/first-kill description; keyboard/focus/44px/contrast/reduced-motion/no horizontal overflow; exact export/Continue equality, clean console and bridge absent |
| tc-pe-13 earned E2E | Separately reviewed fresh native route toL18 with frozen legal choices/seed/budget; retain every attempt and reward export | Exact earned XP/points/loot provenance and legal Dagger/PE allocation, then actual body→cast→15MP→one-body→poison HP; unsuccessful outcomes reported without recipe adaptation/retries |
| tc-pe-14 manual | Owner/fresh player uses opening kill then PE under ordinary play; record build/elapsed/attempts and observations | Determine whether requirement, shared competition and poison feedback are understandable/satisfying; report findings without inferring feel from automated completion |

## Execution stages and evidence

Freeze the decisive tc-pe-05 periodic oracle before implementation: seed7,
both units attackSpeed100, zero mitigation/dodge/crit, target1000HP held
indefinitely. Target starts with two rate-less Poison stacks at0..3000,
Bleed0.5HP/s expiring1700, harmless marker expiring2000. Hero makes one real
fixed20 poison hit at1700 with0.05 coefficient, then is held from1701.
Before1700 there is no whole DoT damage, but0.85HP fractional integral is earned.
The hit promotes Poison to three×1HP/s, source hero, original start0, expiry6700.
No immediate promotion tick. Target's exact DoT events are
`[[2000,1],[3400,4],[5100,6],[6700,4]]`:15 total DoT and final965HP after20
direct damage. Compare repeat/plain-recorded results and immutable inputs.
Do not preapply a refresh at1700 and start the battle at0 as a prospective oracle;
that snapshot cannot represent the live old-interval/application boundary.

For tc-pe-10 shared spread, use a held source with2HP, Poison two×1HP/s expiring
1000; a held recipient has two active rate-less Poison stacks expiring10000.
Source dies at1000 and its half-stack spread promotes recipient to three×1HP/s,
sourceID dying unit, original clocks retained. Recipient's first DoT event is2HP
at1700 and total27HP through10000. No dead/orphan recipient gains spread.
These are analytic expected oracles, not executed results.

Before the PE runtime patch, freeze a successful production-PE seed/setup and
literal base roll, post-combo ordinary hit, adopted/retained potency and HP oracle.
Existing three+ Poison stacks change the hit through the ordinary poison combo;
do not reuse a no-status base roll as the final damage expectation.

Consumption counts prove conservation, not which corpse identity was dequeued.
Keep focused FIFO source review alongside count/competition tests; do not claim
that identical count feedback independently establishes ordering of token IDs.

Shared-refresh child covers01–05 plus spread/control regressions before PE.
PE definition/combat child covers06–10; native child11; browser child12;
earned route13 and experiential14 remain separate. Split each child to<=5
owned files before changes. Before a runtime patch, run a meaningful expected
failure and file the structured bug with exact source/seed/actual versus expected.
Do not commit required failing tests separately or change unrelated expectations
to force green. Two previous rate-less assertions change only under the explicit
forward qualification, preserving their alias/expiry checks.

Engine validation: focused cases, `npm run test:engine`, full `npm test`,
`npm run typecheck`, `npm run lint`, production build/bridge scan, changed-module
coverage and independent source/evidence review. Report real timing-budget
misses and warnings; do not weaken gates. User-facing stages add production
browser proofs. Each child retains exact command/source hashes, failure/green
logs and small decisive evidence; root removes manifest-verified disposable
outputs after all readers release. Shared caches/tools/history remain intact.

Coverage maps contract criteria1→01–05,09–10;2→06–11;3→12–14.
No balance-sim or automated timing proxy certifies player feel. PE tuning/TTK,
earned affordability, broad class/act matrix and full-v1 gates remain open.
