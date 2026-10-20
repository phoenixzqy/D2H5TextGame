# BUG-045 — Publish coherent derived stats when allocating attributes

Status: reproduced source divergence; P11a01A RED pending, runtime unchanged.
Severity: High (attribute spending leaves persisted/displayed derived stats stale).
Owner: engine-dev / frontend-dev; root integration, independent producer/QA.

## Reproduction

Input head67e4019, runtime baseline5f14aa7. Linux/Node24/Vitest ui/jsdom;
viewport, locale and RNG seed are not applicable to this synchronous store
reproduction. Separate UI gap is source-confirmed in CharacterScreen143–185:
unspent points are displayed but no allocation control exists. No native
allocation/save/reopen acceptance is claimed in A.

1. Create an unarmed L4 Sorceress: base10/25/10/35, statPoints1,
   derived life120/144, mana102/114, attack28, defense29, attackSpeed125.
2. Call the real playerStore.allocateStatPoint('vitality').
3. Observe vitality11 and points0, but unchanged lifeMax144 (expected146).
   Energy35→36 similarly leaves manaMax114 instead of116. Export serializes
   this stored player; combat adapter recomposition does not repair it.
4. Repeat with current inventory gear and stale player.equipment decoy;
   expect current authoritative equipment exactly once and one publication.
5. At numeric legacy balances0.5 and base499.5/500/501, attempt one point.
   Current source subtracts a full point or exceeds the authored base cap.

Expected: one base+1 and one available point−1 with full canonical derived
recomposition at current level/current inventory.equipped in one publication.
Preserve/clamp current HP/MP without refill. Refuse without publication when
no player, balance<1 or prospective chosen base+1>500. Preserve all unrelated
state and legacy values; equipment bonuses do not gate base allocation.

Actual: playerStore165–180 only updates base core/pool, retaining the original
derivedStats reference. It has no cap and accepts any positive fractional pool.
Root cause: the allocation mutation omits the canonical equipment composition
already used by gainExperience and does not enforce the full spend boundary.
Workaround: later recomputeDerived/combat composition can rebuild derived stats;
neither makes the allocation publication or persisted state correct.

## Controlling sources and scope

[Allocation contract](../../docs/plans/decisions/P11a01-stat-allocation-v1.md).
progression-curve§4.2 explicitly caps each base stat500; equipped-stats9–25
preserves current pools and composes gear. D09 lossless ingest v1d and existing
XP composition establish inventory.equipped authority. save/validate.ts8,133,162
accepts fractional numeric core/point values, so guards inspect prospective
values without coercing or rewriting old saves. Existing0.2 Energy/sec recovery
is unchanged; no formula, class growth, combat tuning, healing or save version.

Security check: pass. Scope: owner-authorized local allocation state/validation.
No credentials, external execution, permissions, networking or policy bypass.

## Existing oracle reconciliation

warmth-composition.test.ts137–145 currently says:

```ts
it('derives a core allocation even before cached derived stats are recomputed', () => {
  arrange(199, { statPoints: 1, skillLevels: {} });
  const before = player().derivedStats;
  usePlayerStore.getState().allocateStatPoint('energy');
  expect(player().coreStats.energy).toBe(200);
  expect(player().derivedStats).toBe(before);
```

The identity assertion explicitly preserves this bug. Replace only that test's
name/identity oracle with literal coherent manaMax350/current102; preserve the
existing adapter manaMax350/recovery40/no-fire-bonus assertions and unchanged
frozen-recording/next-wave integration. Independent source review is required
before the test change. Original whole-file SHA256:
b3602a8d271eab384b041a051967b0e1425584a4a374d9f5957b2823f23ff5e7.
Producer and QA independently approved this exact source-backed correction
and revised five-file runtime scope before amendments.

## Evidence

Documentation checkpoint precedes genuine focused RED/freeze/review and runtime
implementation. Raw logs belong to root's task-isolated stat-allocation scratch
directory until independent evidence consumers finish; exact commands, hashes,
counts, timing limits and final cleanup will be recorded here.
