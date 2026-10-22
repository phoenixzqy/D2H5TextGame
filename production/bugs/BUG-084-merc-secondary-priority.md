# BUG-084 — Allow owned mercenary secondary skill priority changes

Status: fixed locally. Severity: High — an owned combat capability cannot be selected.
Owner: store/frontend developer; GD contract D04-merc-skill-priority-v1.

## Reproduction

Build8f73217, Node production-service replay, en; no browser/viewport claim.
Seed2223645302, original unique earned L12, Blood Moor102/Cold Plains103.

1. Field the earned Inner Sight Rogue with its unchanged default order:
   Inner Sight, Basic Arrow, Pierce Arrow.
2. Resolve Cold Plains W3 for60seconds.
3. Count her action events and inspect Mercs screen controls.

Expected: player can prioritize an existing secondary ability and have that
choice respected in new recordings and saved progress, with signature first.

Actual: ten Inner Sight and29 Basic Arrow casts, zero Pierce Arrow casts.
Basic Arrow's1s cooldown is shorter than the1524ms action period, so the
first-ready selector never reaches Pierce. No ordinary reorder action or
screen controls exist. No missing-resource or scheduler error is established.

Evidence: [frozen earned diagnosis](../../docs/plans/evidence/p02-cold-plains-diagnosis.md),
raw report SHA f9e9464f1f2a35fa1602521d958a8910121c678ffd72a87cde497b8027803975.
`src/data/loaders/mercs.ts` supplies all three skills; `chooseSkillForState`
in `src/engine/combat/combat.ts` intentionally takes the first eligible entry.

Fix at the missing player-control boundary. Preserve defaults and effective
skill definitions, prohibit grants/removals/duplicates and active-run changes,
and use existing saved comboOrder. An edited service snapshot is no browser
workaround or earned route acceptance. Regression tests precede runtime patch.

## Resolution

Owned secondary skills can now be reordered through guarded ordinary controls;
signature remains first and existing saves retain the choice. Focused17/full8417
tests, types/lint/build and both-language production-browser Save/Continue checks
pass. Source review APPROVE/security PASS; QA ADEQUATE. The chosen Pierce-first
route still draws Cold Plains W3, so the separate progression issue stays open.
[Evidence](../../docs/plans/evidence/p13-merc-skill-priority.md).
