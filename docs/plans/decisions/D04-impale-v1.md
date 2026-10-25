# D04 — Impale Bleed and ordinary Defense bypass

2026-10-25. Preimplementation contract for reproduced BUG202. Root is sole
writer/author reviewer; independent design/QA and earned balance remain open.
The Freezing Arrow verification is separate. No Impale implementation or credit.

Preserve actual Physical75–110/+7rank, single enemy,10MP,2second cooldown,
unlock12/cap20 and Jab→Power Strike prerequisite chain. Both existing locales
promise ordinary Defense bypass; implement that promised mechanic rather than
removing it to make a data-only repair easier. This is not guaranteed hit,
resistance penetration, defense stat removal, Magic Resist bypass or extra damage.

Author `ignoresDefense:true` on the actual Impale row, with a closed typed
capability propagated through the existing JSON→registered damage pipeline.
Use the existing narrow `ignoresMagicResist` capability as the architectural
precedent; override the current hit's effective ordinary Defense input at the
shared builder. Do not mutate the target/base stats, special-case damage after
settlement or globally weaken mitigation. Schema permits the capability only
for this actual active Physical/one-Bleed identity and rejects contradictory
payloads. All other damage inputs, RNG, defenses and capabilities stay exact.

Add explicit `statusEffect.dotPctOfDamage:0.1`, following existing Maul's Bleed
rate. This is provisional v1 potency, not inferred from inert markers or an
earned/canonical balance claim. Reuse existing on-hit captured potency and
shared Bleed lifecycle: three seconds, one stack, refresh duration, ordinary
minimum/fractional integration/expiry. Do not add a global implicit rate or
re-mitigate periodic damage. Prove capture once from the actual final hit,
including resistance/critical/combo and bypass, and existing refresh semantics.

Write REDs before source changes: real legal native ranks1/2/20, literal hit
and full periodic HP loss; paired Defense0/100/500 must become identical while
ordinary sibling attacks remain defense-sensitive. Preserve resistance/dodge/
miss/critical/Magic Resist behavior and input immutability/replay. Cover actual
three-second expiry, repeat casts/cooldown, mana refusal, native class/unlock/
rank/transitive prerequisites/aliases, death and already-dead targeting. Review
existing shields/reflection/status-before-death settlement rather than silently
changing it. No new saved field/version or earned campaign action.

Use existing display helpers for per-stack rate/duration/cap/floor and describe
ordinary Defense bypass truthfully in both locales. Unlearned/current/next/MAX
and public allocation/configuration, actual hit/Bleed logs, exact five-domain
Save-close-new-page-Continue and desktop/mobile/five-size geometry are required.
Synthetic fixtures are not earned class/build proof.

Root-only ordered delivery: schema/types/adapter→minimal shared builder and
JSON→native causal compatibility→bilingual presentation→focused/data/engine/
strict types/lint/build/browser→freeze exact final inputs→one useful complete
full run→commits and actual blob audit→one-row inventory credit/evidence/cleanup.
Do not begin the full run while essential prechecks are still unresolved.
Retain failed and superseded evidence, stop only exact owned processes and keep
full C2–C4/G0–G7/privatev1 scope open. No remote operations/deployment.

Author security check: pass, scoped local gameplay/types/schema/UI/tests; no
credential/network/dependency/CI/permission/persistence expansion. Author plan
review: ready after explicitly including the promised bypass, closed capability,
negative sibling controls and existing complete status/death settlement. Root
self-review does not substitute for independent acceptance.
