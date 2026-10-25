# BUG-229 — Meteor excludes separated and overflow enemies

Severity: Medium. Status: locally fixed and verified; independent acceptance open.
Owner: root (engine/content/frontend); independent design/QA remains open.

## Reproduction

Source `71fcfd62`, Node/Vitest production registry and native Sorceress projector;
browser/viewport/locale not needed for this engine reproduction. Seed7.

1. Give a synthetic L30 Sorceress legal Meteor prerequisites, rank1/2/20,
   100MP and one action, using `playerToCombatUnit` and `runBattleRecorded`.
2. Place twelve living enemies in four rows of three.
3. Alternatively place three enemies at rows0/3/6 and columns0/1/2.

Expected: the All target specified in `docs/design/skills-spec.md` §3.1 makes
one independent attempt per living hostile, paying50MP once.
Actual: the first fixture attempts only nine targets; the separated fixture
attempts only the first of three. All four regression cases fail.

Evidence: `src/stores/sorceress-direct-fire.causal.test.ts`; retained final packet
will include `targeting-red.log` and the actual exit1 wrapper receipt.
Root cause: `sorceress.json` and the illustrative legacy builder both select
area-enemies/box-3x3. The shared all-enemies resolver already supports the promise.
Workaround: pack targets in the box; there is no player-controlled positioning.

## Verification

Source `5ef31577` switches Meteor to all-enemies in JSON and legacy builder, without changing numeric tuning. Strict schema rejects the old geometry and retains optional legacy Melt metadata. Actual native damage/recipient/payment, Burn and post-hit Melt regressions pass. Final full15743/715/two existing skips; types/lint/build/precache and12production browser cases pass. [Evidence](../../docs/plans/evidence/d04-sorceress-direct-fire.md). Independent design/QA, earned balance and full-v1 acceptance remain open; genuine campaign unchanged.
