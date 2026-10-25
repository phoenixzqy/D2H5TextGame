# BUG-227 — Use the advertised cone for Frozen Orb

- Status: locally fixed/verified; independent design/QA and earned balance open.
- Severity: Medium — a paid cold attack works, but its advertised target shape is wrong.
- Owner: root, engine/data/UI; independent design/QA and earned balance open.
- Reproduction build: `eeaaa48d`; Frozen Orb data, targeting and descriptions unchanged by that commit.
- Environment: Node24 native combat; seeds7/19/41/97, legal native L30Sorceress
  rank1/2/20 with the complete Ice Bolt→Ice Blast→Glacial Spike→Blizzard chain.
  No browser viewport. Both locales and skills-spec §3.1 promise a cone.
- Affected systems: authored and legacy Frozen Orb geometry, actual per-target
  cold damage/Chill, native class eligibility and truthful bilingual previews.

## Reproduction

1. Legally configure Frozen Orb at each rank through native player composition.
2. Place nine living hostile units in the nine distinct cells of a3×3formation.
   Declare synthetic million-HP/100MP pools, zero enemy mitigation, no crit or
   dodge bonuses, and normal hero100Attack Speed.
3. Hold enemies from time0 and the caster only from1701ms, isolating exactly
   one paid Frozen Orb cast at1700ms without enemy attacks or later recasts.
4. Retain all12rank/seed observations, actual attempt recipients and HP loss,
   one30MP debit, unchanged inputs and exact same-seed replay. Then deliberately
   assert the existing cone-2 shape for comparison.

Expected: the cone promised in `docs/design/skills-spec.md` §3.1 and both
localized descriptions must govern actual target selection. Its concrete grid
dimensions need an explicit contract. The existing cone-2 resolver selects one
apex and three cells in the following row, four targets in this distinct-cell
fixture; it is a candidate reuse, not a recovered numeric tuning approval.

Actual: all12cases attempt all nine units in row-major order from one paid
cast. Authored `src/data/skills/sorceress.json` and legacy
`src/engine/skills/builders.ts` select `box-3x3`. Attempted targets include cells
outside the existing cone. Actual total HP loss equals damage-event totals;
cost/replay/immutability controls pass. No game repair or skill credit is claimed.

Evidence: `next-frozen-orb-probe.ts`, `next-frozen-orb-observations.json` and
`next-frozen-orb-corrected-result.json` in the
[warcry-control packet](../../docs/plans/evidence/fixtures/barbarian-warcry-control/packet.json).
The initial probe incorrectly expected native composition to canonicalize the
stored priority; it stops before combat. Its original script/failed receipt
remain separate. Correcting that fixture expectation leaves the cone assertion
intact and yields the complete12-case intentional geometry failure.

This does not establish that geometry causes Baal's timeout. Preserve existing
damage/rank/cost/cooldown/Chill and mitigation until a separate reviewed change
is supported. Genuine L33/Ancients complete/Baal uncleared remains unchanged.


## Local delivery — 2026-10-25

Source dc489cb1 repairs authored and legacy target geometry and adds an
identity/schema guard. Ranks1/2/20 ×four seeds prove actual paid recipients,
HP/MP conservation and Chill. Full15610/711/two existing skips, engine7933/296,
loader292/1, types/lint/build/precache and16public browser cases pass.
[Delivered evidence](../../docs/plans/evidence/d04-sorceress-cold-attacks.md).
Independent design/QA and earned campaign/balance acceptance remain open.
