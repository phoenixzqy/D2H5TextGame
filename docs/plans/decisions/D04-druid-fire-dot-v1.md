# D04 — Druid fire on-hit Burn

Status: local implementation contract, 2026-10-24; independent design/QA and
earned balance acceptance remain open. Root is the sole writer. This is a
child of [D04 fire identity](D04-fire-status-alias-v1.md), not a global rate default.

## Objective and controlling evidence

G2 requires every advertised effect to change actual combat state. The five
Druid fire spells below declare Burn but omit `statusEffect.dotPctOfDamage`.
At `ccf9762`, actual registered spells produce zero periodic HP loss at ranks
1, 2 and 20 (15 causal failures; 10 insufficient-mana/miss controls pass).
Burn/Ignite identity, integration and rate-less promotion already work.

## Chosen behavior and parameters

Author an explicit **0.1 fraction of the final mitigated hit per second per
stack** on each named JSON row, matching the existing Fire Bolt rate. This is
provisional tuning for functional completeness, not measured balance. A common
fraction is justified by the existing common on-hit Burn semantics; authored
hit/rank growth, targeting, costs and cooldowns differentiate the five spells.
Do not invent physical Boulder/Volcano hits, continuous projectiles, geometry,
independent summons, extra casts or falling meteors absent from the v1 data.

| Data slug (`skills-druid-…`) | Rank-1 damage | Damage/rank above 1 | Mana | CD seconds | Unlock | Target | Full learned prerequisite chain |
| --- | --- | --- | --- | --- | --- | --- | --- |
| firestorm | 40–60 Fire | 4 | 20 | 2 | 1 | all enemies | none |
| molten-boulder | 45–65 Fire | 4 | 12 | 2 | 6 | area enemies | Firestorm |
| fissure | 60–90 Fire | 5 | 20 | 3 | 12 | all enemies | Firestorm → Boulder |
| volcano | 80–115 Fire | 7 | 27 | 4 | 24 | all enemies | Firestorm → Boulder → Fissure |
| armageddon | 110–160 Fire | 9 | 35 | 5 | 30 | all enemies | Firestorm → Boulder → Fissure → Volcano |

Canonical IDs use `druid.` and underscores; all ranks cap at 20. Preserve
exact alias/MAX, native ownership/unlocks/transitive prerequisites and
next-wave configuration. Each landed hit applies one canonical Ignite stack
with `max(1, floor(finalHitDamage * 0.1))` DPS for three seconds, capped at five
aggregate stacks. Misses pay normal mana/CD but apply no Burn. Unaffordable or
cooling spells follow existing basic-attack fallback. Spell damage remains
independent of weapon Attack; Elemental Mastery and mitigation affect the hit
once and therefore the captured DoT once. No second resistance/crit/combo roll.

Existing aggregate refresh retains valid original potency/source/start, caps
stacks and extends finite expiry; a rate-less marker may adopt valid incoming
potency prospectively. Preserve fractional carry, exact final interval,
physical/poison combos, boss/death/tie and wave cleanup rules. No implicit rates
for other spells, no shared status runtime change, no persisted transient state
or save-version bump (Save22 unchanged).

## Alternatives and tradeoffs

Keeping cosmetic markers violates the advertised Burn. A global fallback would
invent rates for unrelated skills and contradict D04. Individually different
fractions currently lack earned balance evidence and add unjustified tuning.
The explicit common reference fraction can be revised through normal balance
work after functional delivery; it is not an approved pacing target.

## Structure, implementation and style

Use existing JSON `statusEffect` and catalog forwarding. Schema guards require
finite positive explicit fractions on these five IDs. Keep engine pure TS and
strict, use the existing seeded PRNG, and add no dependencies. The pure display
resolver exposes Burn rate/duration/stack rules from authored metadata and
shared status defaults; Skills renders localized rows and prose in en/zh-CN.
Do not present base-hit-derived DPS as guaranteed post-mitigation damage.

## Ordered tasks and verification

1. Record BUG190 and original RED before changing source/data.
2. Validate data/schema, actual identities/ranks/hit/HP/timing, mitigation,
   Attack independence, targeting, miss/resources/CD, stacking/promotion,
   native ownership/configuration/replay and unchanged Save22.
3. Add bilingual current/next/unlearned/MAX Burn presentation and ordinary
   learn/upgrade/configure controls. Test actual production desktop/mobile
   controls and complete Save-close-new-page-Continue domain equality. Imported
   high-level fixtures must be disclosed and earn no campaign credit.
4. Run focused `npx vitest run <changed tests>`, `npm run test:engine`,
   `npm test`, `npm run typecheck`, `npm run lint`, production
   `VITE_E2E=false npm run build -- --outDir <task-owned-path>` and
   `node scripts/check-test-bridge-shaken.mjs <build-path>` where supported.
   `validate:data` is absent; schema/data tests provide actual validation.
5. Review the complete diff, retain original failures and exact command results,
   update only proven inventory rows, archive/verify required evidence and
   remove exact disposable task paths. Preserve genuine campaign evidence.

## Review and boundaries

Security check: pass. Local first-party game-data/UI repair; no credentials,
network, permissions, CI, dependency or release changes. Plan review: ready
after requiring actual final-HP/timing tests, explicit provisional tuning,
rate-less control, native eligibility and truthful post-mitigation wording.
These are root self-reviews, not independent approvals. No push/PR/merge,
deployment or genuine campaign action. Full private v1/C2–C4/G0–G7 remain open.
