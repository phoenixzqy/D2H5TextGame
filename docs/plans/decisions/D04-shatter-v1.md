# D04 — Shatter execution for current authored physical hits

Status: scoped implementation d247f07 validated; GD/TD/producer/QA approve.
Scope: the existing Freeze→physical execute promised by combo-matrix §4.1;
no campaign, earned clear, full D04, all-skill or balance acceptance.

Evaluate unchanged `shouldShatter` on the living pre-hit target's
`activeStatusView(target, simClockMs)`, after ordinary damage resolution. A
landed direct physical hit with positive ordinary damage executes strictly below
20% pre-hit HP. Exact 20%, a hit crossing below it, a miss, elemental/thorns/DoT
or Freeze first applied by that hit does not execute. Basic and current authored
physical skill hits qualify, on all sides and tiers. Freeze uses existing
half-open clocks and legacy indefinite semantics. Boss ordinary amplification
remains reduced; execute eligibility is unchanged. Once per target means one
successful terminal execution; existing death handling guarantees that without
new fields/counters. Resurrection is outside this card.

Resolve ordinary hit/base/crit first, with no new RNG draws. Emit the existing
single damage event with `max(ordinaryFinal, preHitLife)` on execute, retaining
crit/dodge metadata and ordinary overkill. Use that amount for HP; retain
ordinary damage for on-hit DoT potency and unchanged status-roll order. Finish
through the existing death closure: ownership graph, schedule removal, ordered
single deaths, primary effects, summon refunds and orphan-only despawns. Death
orb draws/later actions may differ naturally because death happens earlier.

Strict threshold, physical/Freeze/living predicate, ordinary multipliers, status
clocks and death machinery are inherited. Pre-hit/positive-hit interpretation,
boss eligibility, successful-execute cooldown meaning, event amount and ordinary
DoT potency are explicit GD defaults adopted for this scoped implementation.
Retain the existing helper/threshold unchanged; no new numeric authority or
JSON tuning is introduced.

GD audited all current authored skills and adapters: physical skills do not
supply Freeze; all Freeze skills are cold. Thus Frost Nova→later basic and the
current authored physical catalog satisfy no-self-combo without excluding the
same caster. Generic source-skill provenance remains unresolved for future
mixed physical/Freeze effects; a catalog invariant test flags that expansion
before this bounded compliance claim can be extended.

Root owns `combat.ts`, `shatter.test.ts`, this document and BUG-054 after causal
RED. Producer/QA independently review plan and exact tests before execution;
freeze, genuine runtime RED, bug report, minimal shared hit-path patch, engine
then complete U/coverage/T/L and post-consumer production build/bridge. Preserve
all failures; independently review post-freeze test changes. Follow with indexed
durable evidence/review/commit, exact task-owned cleanup and closing ledger.
RAW: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-shatter-u75_js3c`.
Bounded runner/caps remain 30/120/120/90/90/210 seconds plus 2s cleanup, 32MiB per
report/log and 64MiB total; run coverage before building to avoid retained dist.
No remote action or automatic stronger gameplay retry.
