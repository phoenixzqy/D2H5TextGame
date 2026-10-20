# BUG-055 — Apply the Rogue's authored Inner Sight to enemy defense

Status: Fixed in `45cd527`; independent producer/QA/GD/TD approval.
Severity: High — the starter Rogue's advertised enemy-defense reduction is absent.
Owner: engine-dev; root implements, producer/QA independently review.

## Reproduction

Base commit6b9950444a2ff7839d2a6cfaf794da95d42005e2 with reviewed Stage A/B
metadata/schema/definition additions, registry/combat/aliases still byte-identical
to that base. Node/Linux Vitest engine project. Browser/viewport/locale do not
apply to this pure engine reproduction. Seeds7 and1 as below.

1. Run `npx vitest run --project engine src/engine/combat/inner-sight.test.ts`.
2. Seed7: create the actual starter Rogue via `createMercFromDef` then
   `mercToCombatUnit`; preserve its stats and three-skill loadout. Hold enemies
   and close the fixture after7800ms with a test-owned hero periodic death.
3. Observe its native1524ms and expected7620ms Inner Sight casts.
4. Seed1 source-death fixture: Rogue casts1524ms, dies to test-owned Ignite at
   2000ms; a hero's ordinary physical hits land at1700/3400ms.

Expected: nondamaging all-living-enemy debuff,25% ordinary defense reduction,
8000ms duration and CD5s. Native refresh at7620ms extends9524→15620ms. Source
death does not dispel. Fixed100 direct damage vs defense20 yields85, retaining
ordinary hit/crit/RNG/mitigation rules. Defense21 retains15.75 and floors to84.

Actual: native casts only1524ms, adds an inert permanent self-buff, applies no
enemy status. Both seed1 hero hits deal80. Even a pre-existing active exact
`merc-inner-sight` marker leaves armor damage80 and fractional-defense damage79.

## Evidence and root cause

Frozen runtime test SHA8ef57380464d6101ac08386c9a1b050513fa16fb23973f1a95ec58da2aecd657.
Bounded genuine runtime RED:12 failed/13 controls,25 reached assertions,
exit1 in2.839s; no collection failure, timeout, signal or survivor.
The prior schema/missing-module REDs are representation evidence only.

RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-inner-sight-yv8t2nts`
contains `focused-c-red.log`, JSON report, frozen tests, before sources and
command/process metadata. Durable evidence will be indexed at
`docs/plans/evidence/p08a07-rogue-inner-sight.md` before exact cleanup.

`MERC_STUB_SKILLS` binds the exact skill to a self-buff with cooldown0; the
shared `buildDamageInput` always supplies authoritative defense unchanged.
Replace that exact binding with the reviewed JSON-derived skill and project
ordinary armor from the active pre-hit exact status. Reuse existing generic
status timing/refresh and damage pipeline. No new potency field or status
default is needed. No workaround provides this advertised mechanic.

This reproduction establishes no campaign clear, balance sign-off, or cause
for a previous native draw. Full private-v1 gates remain open.

## Acceptance audit correction

Independent TD review found the exact-row schema still accepted cooldown0,
contrary to the approved positive-cooldown resolver boundary. After producer/QA
review, one zero-cooldown case was added to each loader/resolver rejection
table. Frozen amended tests produce exactly2 rejection assertion failures and
275 passes (3.819s process), before the exact-ID schema correction. This is
representation evidence, not a new gameplay reproduction. Authored cooldown5
and generic zero-cooldown acceptance remain unchanged. Original frozen tests,
failed typecheck and approved equivalent type-narrowing correction are retained.

## Resolution

`45cd527` implements the exact JSON-derived enemy status and shared active
pre-hit armor projection. Final engine1224/full3452 tests, typecheck, lint,
production build and five completed native-browser cases pass. Coverage gate
passes; its later lint-only correction and all original failures remain
explicit in [evidence](../../docs/plans/evidence/p08a07-rogue-inner-sight.md).
All 248 records are preserved and independently verified before exact cleanup;
3019 process identities are nonlive. No campaign/balance/mobile-readability claim.
