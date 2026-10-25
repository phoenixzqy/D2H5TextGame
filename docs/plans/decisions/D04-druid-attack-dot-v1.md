# D04 — Druid Maul, Rabies and Fire Claws

Local implementation contract for BUG192. Root is sole writer; independent
design/QA and earned balance remain open. Full private v1 remains the goal.

## Reconciliation and authored behavior

All three actual paid attacks create status markers but author no damaging
potency. Add explicit on-hit fractions: Maul Bleed 10%, Rabies Poison 5%, Fire
Claws Burn 10% of the final mitigated hit per second per stack. Poison uses the
existing Poison Javelin/Poison Explosion reference; Burn uses Fire Bolt and the
five repaired Druid fire spells. Bleed has no authored numeric reference; 10%
for its single three-second stack is an explicit provisional v1 tuning choice,
not a canonical D2 or earned-balance claim. No global implicit rate is added.

Preserve authored fixed hit ranges, growth, single target, unlocks, full
prerequisite chains, costs, cooldowns and rank20 caps. Fixed hits remain
independent of weapon Attack, under the existing data catalog contract. Keep
seeded ordinary crit/dodge/status rolls and actual miss/resource behavior.

Maul's legacy ID/name says Werewolf but its authored prerequisite is Werebear.
The controlling skills-spec row describes a high single-target Physical/Bleed
attack, not a transformation. Preserve both identity and prerequisite; correct
the stale transformation prose. Like other authored attacks, Maul can strike
in any current form and does not create or replace a paid form. Werewolf and
Werebear remain separate paid controls under their existing contract. This
clarification must be explicit in both locales and the controlling spec.
Fire Claws is its authored single Fire hit plus Burn, not a persistent basic-
attack enchantment. Rabies chains through the existing on-death Poison rule:
half the dying target's stacks, floored with minimum one, spread to each living
same-side unit, retaining captured per-stack potency and a fresh five-second
application. There is no immediate spread to living neighbors on every hit.

## Status and lifecycle

Bleed: three seconds, one stack, refresh duration. Poison: five seconds, ten
stacks, existing aggregate refresh and on-death chains. Burn canonicalizes to
Ignite: three seconds, five stacks. Every incoming stack captures
max(1, floor(finalHit * authoredFraction)); already damaging aggregate statuses
retain their original per-stack rate. Rate-less legacy markers may adopt a
valid incoming rate prospectively. Existing fractional integration, exact
expiry, death priority, cleansing and wave cleanup remain authoritative.
No periodic damage is re-mitigated or scaled twice. No healing/refill, RNG,
base-stat, save version or new saved status field is introduced.

Native current class, integer unlock level, full transitive prerequisites and
MAX-valid exact aliases govern paid casts. New allocations apply next wave,
recorded inputs/replay remain immutable, and Save22 persists allocations/combo
only. No native form dependency is silently invented for these attacks.

## Ordered implementation and proof

1. Preserve genuine rank1/20 native causal RED and file BUG192 before data fixes.
2. Strict schema requires positive finite explicit potency and matching active,
   single-target damage/status identity for each row. Add only the three JSON
   metadata payloads; reuse the existing adapter/status/damage runtime.
3. Verify ranks1/2/20 literal hits and full periodic HP loss, payment, exact CD,
   dodge/unaffordable/targeting/Attack controls, capture-once mitigation,
   refresh/stack caps/rate-less promotion and exact expiry. Rabies must prove
   actual first and second death chains, expiry-before-death and recipient
   boundaries. Maul must prove it neither creates nor changes paid forms.
4. Show actual Bleed/Poison rate/duration/cap in current/next/MAX/unlearned
   details, preserve existing Burn display, and correct all three descriptions
   in en/zh-CN. Native allocation/configuration, unchanged Save22 and production
   desktop/mobile public controls plus exact five-domain close/reopen required.
5. Run focused Vitest, engine/full, types/lint, explicit VITE_E2E=false owned
   build and forbidden-bridge scan. Freeze source/build/Git/genuine through full
   verification, check committed blobs, retain original failures and clean exact
   task-owned artifacts. No push, PR, merge, deployment or genuine campaign action.
   validate:data is absent; actual schema/data tests supply validation.

## Reviews and boundaries

Security check: pass. First-party local game-data/display repair, no credentials,
permissions, CI, dependency, external execution or publication change.
Plan review: ready after requiring the Maul/form and Fire Claws/enchantment
reconciliation and actual two-hop Rabies death-chain proof. Root self-reviews
are not independent approvals. No skill credit before whole local contract is
verified; earned balance, C2–C4 and full G0–G7 remain open.
