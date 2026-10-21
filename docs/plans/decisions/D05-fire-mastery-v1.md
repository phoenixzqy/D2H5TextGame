# D05 / P07a02 — automatic player Fire Mastery

Status: GD/TD approve this narrowed contract; producer plan review is ready and
QA approves concrete Stage A tests. Stage A adds schema/definition/rank only;
combat composition, native boundaries, copy reconciliation and browser acceptance
remain open. Full private-v1/C0–C4/G0–G7 remain open.

## Controlling source and behavior

Exact authored `skills-sorceress-fire-mastery` / canonical
`sorceress.fire_mastery` identifies this player passive. Preserve current JSON
requiredLevel30, cap20 and fireDamagePct.04 per allocated rank. requiredLevel is
authoritative; minLevel12 remains a legacy fallback. This decision deliberately
supersedes the older Sorceress spec's level12/fixed30% promise and both locales'
fixed30% descriptions. Reconcile that spec and both locale descriptions in a
separate three-file increment before full Fire Mastery acceptance.

The definition selects exactly one authored identity, validates it with the
existing strict Ajv2020 skill schema and copies/freeze only primitive
`{requiredLevel, maxRank, fireDamagePctPerRank}`. Caller data/catalog/registry
mutations cannot change this snapshot. Current numbers are tuning, not schema
constants: positive integer unlock/cap and finite nonnegative coefficient with
no invented upper balance ceiling. Exact schema requires passive/self/zeroCD,
closed fire-only scaling and no payment, damage, status/tag/synergy, heal, summon,
AoE or equipment-gate metadata. Optional passive is true; aura/summon false.
Other identities preserve their existing schema behavior.

`resolveFireMasteryRank(levels?, definition?)` is allocation-only: accept finite
positive integers under the two exact aliases, take their maximum once and clamp
to the copied authored cap. Missing/invalid/wrong aliases give0. No active-skill
rank1 fallback, combo/marker inference or alias summation. Later authoritative
hero composition checks Sorceress and finite level at least the copied unlock;
CombatUnit has no class field and gains no kind/class eligibility gate.

## Required runtime integration after Stage A

Add Fire Mastery once alongside Warmth in existing hero fire increasedPct:
`.04 × masteryRank + .01 × warmthRank` with current tuning. Both cap20 yield+100%.
Keep other fire modifiers, recovery, resources and nonfire types intact. No
attack/stat mutation or ally inheritance. Fresh Burn derives from the enhanced
final direct hit once; periodic ticks receive no second multiplier and active
Burn refresh retains canonical potency/source/start policy.

The passive requires no combo, action, MP, cooldown or marker; imported combo
entries cannot execute it. Recompose at existing authoritative native wave/new
run/replay boundaries, explicitly clearing removed/ineligible allocation. Preserve
current frozen recording, stored replay baseline, resource pools and recovery
carry; repeated refresh never stacks or refills. No save field/version/migration.

## Ordered acceptance and ownership

Root owns all writes/execution in the claimed umbrella worktree; independent
agents review read-only. Stage A owns four paths: skill.schema.json,
engine/skills/fire-mastery.ts, its test and this decision. First freeze/review
schema-only tests, preserve genuine schema RED, then separately freeze/append
definition/rank tests and preserve missing-module capability failure before
source. Keep invalid/malformed/alternate tuning and input independence controls.
Run focused, engine, full unit, types, lint and clean production bridge/build
sequentially under existing bounded runner. Preserve failures and corrections,
record timing misses/warnings, independently review exact source/evidence and
clean exact task-owned outputs only after readers release.

Later runtime changes require separate genuine behavioral RED and structured
bug report before patch, literal directfire/Burn and unaffected recording controls,
authoritative class/level/rank/alias/native/no-refill/save proof and qualified
production desktop/mobile en/zh evidence. Definition-only GREEN does not prove
that Fire Mastery affects combat. No earned campaign, balance, new coverage or
full-v1 acceptance follows Stage A.

Security check: PASS. Local deterministic schema/JSON/typed allocation only;
no new network, credentials, dependencies, permissions, CI or save format changes,
external publication or validation bypass. Root retains exact-owned process and
artifact cleanup discipline. No remote action authorized by this decision.
