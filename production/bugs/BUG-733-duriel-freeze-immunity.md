# BUG-733 — Honor Duriel's authored Freeze immunity

- Severity: Medium; the encounter accepts a control effect explicitly forbidden by design.
- Status: Fixed in working tree; focused verification complete (not yet committed).
- Owner: root acting as engine-dev/content-designer/qa-engineer; no delegation.
- Build: working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`,
  after BUG-732 restored native Frost Aura.
- Environment: Node/Vitest 1.6.1 on WSL; engine reproduction, no browser/locale dependency.
- Seed: 13; Normal Tomb chapter wave, challenge ordinal 450, manual and idle.

## Reproduction

1. Run `./node_modules/.bin/vitest run src/stores/combatHelpers.duriel-freeze.test.ts`.
2. Resolve and build the native Tomb chapter wave without modifying Duriel.
3. Use a diagnostic caster's rank-one native Ice Blast, which applies cold
   damage, Freeze and Chill on a hit. This caster is not earned campaign power.
4. Inspect the positive cold hit's status events and recorded status states.

Expected: positive cold damage and Chill, with no Freeze accepted or reported.
`docs/design/monster-spec.md` Boss Notes explicitly says "Immune to Freeze";
its immunity table says "Can be chilled, not frozen".

Actual: both modes report `['freeze', 'chill']`; the current schema also rejects
authored immunity metadata. Three genuine failures are retained in
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-duriel-freeze-6ylefvnr/`
as `regression-red.stdout.log`, `regression-red.stderr.log` and the exit record.

## Root cause and correction scope

Monster data/types/factory/runtime have no status-immunity metadata. The shared
status boundary halves Freeze duration on every boss but cannot reject it for
the native Duriel. Add optional schema-validated `statusImmunities` (currently
supported authored ID: `freeze`), copy it immutably at monster creation, and
reject matching status application before duration/refresh/RNG side effects.
Author it for Duriel only. Names, runtime IDs and elemental resistance do not
grant status immunity; absent definitions retain existing behavior.

Cold damage, Chill, other bosses' half-duration Freeze, chapter skill overrides,
stats and rewards remain independent. Enemy runtime metadata is transient:
`src/stores/persistence.ts:buildStoreSnapshot` saves explicit player/inventory/
merc/map/meta/formation state, not combat enemies. No save version change.
This bug does not close BUG-731 or add formal balance acceptance.

## Verified correction

[Evidence](../../docs/plans/evidence/p15-duriel-freeze-immunity.md):116 affected
tests, zero scoped strict-type diagnostics, affected lint and desktop Chinese/
mobile English native browser playback pass. Mobile followup visibly captures
the Chill-only enemy. Caller audit passes; Frozen Armor's Chill remains valid.
Native metadata/stats, immutable deterministic combat and other-boss controls
pass. Source snapshots are pinned and required evidence retained in the packet
above; exact browser processes/caches are absent.
