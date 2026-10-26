# BUG-241 — Apply Battle Command skill levels to caster and allies

- Status: paid party/passive/corpse/carry increments locally repaired and verified; complete skill acceptance open; no bounded skill credit.
- Severity: High — the advertised skill-rank benefit has no working consumer.
- Owner: root, engine/native composition/data/UI; independent design/QA open.
- Reproduced head: `775fc1aa`; Node24.21.0, pure engine, no browser viewport.
- Locales: en and zh-CN both promise increased skill levels for caster and allies;
  the probe exercises mechanics, not a browser or earned character.
- Seeds:7/19/41/97; Battle Command ranks1/20, eight controlled comparisons.

## Reproduction

1. Use a level30 hero with learned Battle Command and its Shout/Battle Orders
   prerequisites,100MP and100Attack Speed. Give an allied mercenary50Attack Speed.
   Keep one million-HP hostile stunned to isolate the rank effect.
2. Register a diagnostic skill with10Fire base damage and+10per rank. Both caster
   and ally learn rank1. Prioritize the actual production Battle Command for the
   hero, then the diagnostic attack. The ally prioritizes the diagnostic attack.
3. Compare each seed/rank against a control using the same cost/cooldown/rank and
   an inert control buff. This keeps action opportunities, payment and RNG aligned.
4. Check actual command casts/payments/markers, damage for both units, unchanged
   input and exact replay. Persist all observations before intentionally failing
   the missing-rank-benefit assertion.

Expected: while the real command applies, supported learned rank-dependent skills
of caster and allies gain the promised effective skill levels; allocated ranks
remain durable player configuration. This repro does not choose duration,
cap/overcap, passive recomposition or paid-effect snapshot policy for the fix.

Actual: all eight runs cast Battle Command and create its self marker, but caster
and ally damage sequences exactly equal the inert control. Landed allied attacks
remain10damage. Saved/allocated ranks are unchanged, but no transient effective
rank changes exist either. Both locale descriptions promise more than this.
The intentionally failing probe exits1 after retaining its eight observations.

## Evidence and scope

[Compact observations](../../docs/plans/evidence/fixtures/battle-command-reproduction/observations.json).
Raw probe, full observations, log and terminal receipt are retained with the
[Grim Ward diagnostic packet](../../docs/plans/evidence/fixtures/grim-ward/packet.json).
The fixture uses a diagnostic attack to make rank scaling observable. It does
not prove native UI, all advertised skill families, passive behavior, balance or
campaign results. No genuine save, campaign or remote action occurred.

## Suspected root cause and next work

The data row still uses generic self-buff/status routing and generic attack/
defense scaling. No Battle Command effective-rank consumer was found. Native
composition materializes passives and specialized ranks before battle; the
engine also dispatches many dedicated rank projections. A generic+1 in one
central damage function would leave these paths incorrect.

Write a reviewed shared effective-rank contract before implementation. Address
caster/allied scope, learned-only eligibility, caps, prerequisites, equipment and
merc grants, passives, timed expiry, pre-existing paid effects, summons, wave carry,
recomposition and save purity. Preserve existing skill-specific authority checks.

## Incremental repair progress

`318ed060` implements the first dependency: explicit learned-versus-effective
rank arithmetic and one native Barbarian passive projection. Allocated20 can
compose as effective21 without granting an unlearned/locked/foreign/weapon-
mismatched passive or altering saved allocation.57new tests, engine8406/313,
full16932/762/two existing skips, final types/lint/build/precache and bridge
checks pass. [Evidence](../../docs/plans/evidence/d06-temporary-skill-ranks.md).

This does not activate the actual command. The paid party effect, effective
active/specialist/corpse ranks, passive application/removal and life/recovery,
paid snapshots, expiry/death, wave carry, bilingual UI and production persistence
remain unfinished. The original command reproduction is still open; no bounded
skill credit or independent acceptance is added by the dependency increment.

`5e7f0e96` adds the paid finite party effect and effective active/specialist
ranks. `2cb8d1e1` adds native passive lifecycle and paid corpse potency
([evidence](../../docs/plans/evidence/d06-battle-command-passives-corpses.md)).
`9a4433f2` adds qualified native remaining-interval carry with fresh authority,
exact initial observations, final HP layers and deterministic replay/retry
([evidence](../../docs/plans/evidence/d06-battle-command-carry.md)). Final full
17050tests/768files/two existing skips and engine/types/lint/build/precache/bridge
checks pass; tested source and committed blobs match.

Still open: reachable equipped-skill consumer proof, bilingual details
and production mobile/desktop/save/offline acceptance. Read-only presentation
audit found no effect.status/effect.buff battle-command keys in either combat
locale and no positive Command classification in CombatScreen; current generic
details also omit finite duration. These gaps are recorded before their repair.
Root author review is not independent/earned/balance acceptance. Genuine
campaign state and the148bounded skill inventory remain unchanged.
