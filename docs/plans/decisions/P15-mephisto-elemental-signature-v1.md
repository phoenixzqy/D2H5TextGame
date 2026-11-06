# P15 — Mephisto's native three-element signature

2026-11-05. Type: correction/tweak of the existing Act III encounter. BUG749.
Existing private-v1 implementation authorization; root works solo in human2.

## Contract

`monster-spec.md` §6 calls Mephisto a "Tri-element caster
(cold/lightning/poison)." Restore the chapter order to the existing archetype's
Frost Nova, Lightning, Poison Cloud. Preserve all encounter stats, rewards,
wave generation and shared spell damage/status definitions.

First-valid priority remains the controlling AI rule. AS120 gives1540ms actions,
so CD3 Frost Nova can recur every3080ms and starve third-place Poison Cloud.
If the native regression confirms this, author a4s Frost Nova cooldown for
Mephisto only. Lightning stays2s and Poison Cloud3s. The resulting unmodified
cadence is cold1540/lightning3080/poison4620, repeated every4620ms. Ordinary
monsters keep their original Frost Nova cooldown and payload.

Use optional `MonsterDef.skillCooldownOverrides`: a nonempty readonly map of
canonical `monster.*` IDs to seconds >=1, schema validated. The factory copies
and freezes it into transient CombatUnit metadata; ordinary execution uses the
override for that canonical skill instead of rank-derived cooldown. Absent keys
keep existing behavior. It follows the monster through status/control changes;
it is never a mutable cooldown timer or persisted player/save field. No special
Mephisto selector branch, duplicated spells, speed change or save migration.

## Acceptance and bounded verification

Prove genuine RED for the missing skills, then for any restored-list starvation.
Native manual/idle tests must show all three real actions and damage types,
party-wide Chill/Poison and single-target Lightning/Paralyze. Assert unchanged
33600HP/300Attack/360Defense/AS120, chapter/drop source, immutable inputs,
determinism and recorded/plain parity. Schema negatives and factory copy tests
cover the new metadata; an unmodified shared Frost Nova control retains CD3.
Run only these and existing directly affected spell/cooldown tests, scoped
strict types and lint. No earned campaign, population, retry-budget renewal,
build or CI. These constructed diagnostics do not establish balance or pacing.

Poison immunity and the older boss-note three-stack Poison Cloud discrepancy
remain separate requirements; this change enables existing native payloads.
The older numeric-authoring decision froze lists only inside its own slice;
this separately specified signature correction supersedes that local freeze.

## Review

Plan review: ready after including actual action starvation, immutable factory
copy and shared-spell control. The optional source-owned cooldown is the smallest
correction that preserves stats, shared spells and first-valid priority while
making all three elements executable. Security check: pass; local JSON/types/
engine/tests only, no credentials/network/dependencies/permissions/publication.
Root retains the exact BUG749 packet through umbrella acceptance, then removes
it. Disposable processes/caches are cleaned after checks. Full v1 stays open.
