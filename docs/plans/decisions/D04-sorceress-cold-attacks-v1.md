# D04 — Sorceress cold attacks

2026-10-25. Root implementation contract for the selected campaign class;
root remains sole writer/reviewer. Independent design/QA and earned balance
remain open. This four-skill batch does not accept the whole Sorceress roster.

## Paid attacks and targeting

| Skill | Base Cold damage / additional rank | MP / cooldown | Target and landed effect |
| --- | --- | --- | --- |
| Ice Bolt | 30–45 / +4 | 10 / 1s | One living hostile; Chill2s |
| Frost Nova | 25–35 / +3 | 20 / 3s | All living hostiles; Chill2s, then independent10% Freeze1s/boss0.5s |
| Frozen Orb | 60–90 / +6 | 30 / 2s | Existing cone-2; one attempt per selected living hostile, Chill2s |
| Blizzard | 85–125 / +8 | 35 / 4s | All living hostiles, including overflow/separated cells; Chill2s |

Damage, costs, cooldowns, unlocks1/6/30/24, cap20 and the full authored
prerequisite chains remain unchanged. Chill uses the shared JSON multiplier
0.5 on Attack Speed; durations and Frost Nova's10% chance do not scale with
rank. Apply secondary Freeze only on a landed hit, including its ordinary
boss/chapter-boss duration. A miss applies neither status. Exact finite status
expiry, refresh and action cadence retain the shared combat contract.

Frozen Orb's design table and both locales promise a cone, but its data and
legacy builder select a box (BUG227). Reuse cone-2: one occupied apex cell plus
three adjacent cells in the following formation row. Choose the most occupied
footprint, then foremost row/leftmost column; preserve stable row-major targets,
edge clipping, default/overflow positions and duplicate occupants. The four-cell
dimensions are an explicit provisional author adaptation, not prior numeric
approval. Piercing describes multi-target coverage; it does not grant MR bypass
or repeated hits on one target.

Blizzard's two locale descriptions promise all enemies. Its current box can
exclude overflow or separated targets; reproduce before repair. Make the
authored target all-enemies and remove the unused shape through the existing
resolver, retaining one direct hailstorm attack with no invented channel or
periodic damage. Keep legacy registration geometry consistent; its illustrative
numbers are not the production tuning authority.

## Combat, authority and persistence

Each cast pays and starts cooldown once. Each target has its ordinary independent
magical hit/critical/damage roll; Cold resistance and flat MR apply normally.
Personal Cold Mastery and matching damage increases retain their existing
formulas. No Attack conversion, free penetration, additional projectile damage,
mana restoration or global balance change is introduced. Dead/friendly targets
are excluded and caster death stops further resolution. Resource/cooldown
refusal follows ordinary priority/basic fallback without a paid spell.

The existing native class-active projector owns class/unlock/allocated rank,
aliases and transitive prerequisites. Allocate during a recording without
altering that recording; next wave composes new authority without refilling
HP/MP. Real save validation/import retains ranks and priority. Save22 and
transient combat state are unchanged.

## Delivery slices and observable proof

1. Geometry/schema/runtime: own sorceress.json, skill.schema.json, builders.ts,
   one engine contract test and one causal integration test. Prove actual
   recipients/HP/MP at ranks1/2/20×seeds7/19/41/97; retain RED before repair.
   Include all-enemy overflow, cone placement/duplicates/defaults, native
   ownership/refusal, mitigation, paid misses, Freeze/Chill and replay/playback.
2. Presentation: own displayStats.ts, SkillsScreen.tsx, two skills locales and
   one React test. Derive damage/payment/control/shape values from existing
   data; both locales explain real current/next/MAX behavior, not extra shards.
3. Native/browser/evidence: one store lifecycle test plus bounded evidence.
   Verify real prerequisite allocation/priority, next-wave pools, save import,
   en/zh mobile/desktop public casts and exact ordinary/offline Continue.

Run focused RED/GREEN, engine, real loader/schema checks, full tests, typecheck,
lint, production build/precache and relevant public browser paths. The repository
has no validate:data script; use its actual loader/schema tests rather than
claiming that absent command. Freeze source/build inputs and preserve actual
failures. Credit exactly the verified inventory rows after evidence passes.
Retain required evidence and clean exact task-owned disposable paths.

Security check: pass; first-party local gameplay/data/UI/tests, no credentials,
dependencies, saved schema/version change, CI/permissions or remote action.
Plan review: ready after including Blizzard overflow, exact cone ownership,
independent secondary Freeze, native authority and truthful numeric previews.
Root author reviews only; earned campaign/pacing and independent gates stay open.
