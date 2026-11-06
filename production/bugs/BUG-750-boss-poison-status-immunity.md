# BUG-750 — Honor Andariel and Mephisto poison-status immunity

Status: Fixed locally, 2026-11-05. Severity: Medium.
Owner: root, solo private-v1 continuation. Systems: monster content/schema, combat.

## Reproduction

Baseline HEAD: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, inherited working
tree; exact five production snapshots/hashes retained in the packet below.
Node/WSL native engine; no browser, viewport or locale dependency. Seed13.

1. Load validated data; resolve manual/idle chapter waves for Catacombs or
   Durance of Hate at ordinal450 and build via `buildEnemiesForWave`.
2. Record a durable diagnostic caster using native Poison Nova or Plague Javelin.
3. Inspect positive landed poison carriers and the boss's subsequent statuses.

Expected: `docs/design/monster-spec.md` §10 says both bosses cannot be poisoned.
Actual: both accept Poison and Plague. All eight native cases fail on forbidden
status events. The schema also rejects the required explicit poison/plague IDs.
Neither archetype authors status protection; shared status rejection already
exists and death spread uses it. Venom independently emits a success event
without checking status acceptance; cover that once metadata is restored.

Workaround: none through player controls. Elemental damage is separately governed
by the explicit75% cap in `combat-formulas.md` §8.1; do not silently change it.

Regression: `src/stores/combatHelpers.boss-poison-immunity.test.ts`.
Decision: `docs/plans/decisions/P15-boss-poison-status-immunity-v1.md`.
Evidence: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-boss-poison-immunity-uuc3e_8x/red-native.log`.

## Resolution

Both archetypes author Poison/Plague immunity through the existing shared
status boundary. Venom checks actual acceptance before emitting success.
Nine original REDs reproduce missing protection/schema support; metadata-only
restoration leaves four genuine Venom false-success REDs, then the fix passes.
All19new and40existing affected cases pass. Scoped strict types599files/zero
diagnostics and explicit lint pass. An initial assertion used a nonexistent
DoT event field; the corrected assertion rejects every boss DoT event and the
native checks were rerun successfully. No production suppression was added.

[Evidence](../../docs/plans/evidence/p15-boss-poison-status-immunity.md)
records actual scope, retained logs and self-review. No commit is created while
the umbrella work continues. Direct poison damage/75% resistance semantics are
preserved; the conflicting100% requirement and full-v1 balance remain open.
