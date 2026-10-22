# BUG-083 — Restore item-ID allocation before service continuation

Status: open; affects task service reconstruction, not an observed native
persistence failure. Owner: QA/engine-dev. Severity: High — service exports
cannot safely qualify the browser continuation until reconstruction is fixed.

## Reproduction

- Base HEAD38866f7 with provisional Andariel data; Node production-service
  screen, no browser/viewport; locale en; seed2223645302.
- Exact executed source SHA256:
  `ab1c504c3d13ecc7c80224b87d357e258dcff6ba5eca3d62c99f9142948fdf55`.
1. In a fresh module context, decode the retained service-earned L12 save,
   SHA256 `8c46c4f4026116360356a2d17dcde3d723310969a25664f85bc291a1886d2afc`.
2. Restore six saved domains with direct store setters and mark hydration ready,
   as the frozen L13 pilot does. Initial full-save equality passes.
3. Complete the fixed24 Den challenges, ordinals102–125. Retain all drops.
4. Count item objects and unique IDs in the actual pre-route export, and
   compare object additions with the ID-based earned delta.

## Expected and actual

Expected: reconstruction includes the production allocator lifecycle; each
owned item has a distinct ID and actual additions reconcile with reward deltas.

Actual: input3737 objects/3737 unique IDs becomes5033 objects/5010 unique IDs.
There are23 newly rolled, byte-equivalent objects reusing input IDs. Object
growth1296 differs from the reported ID-based1273 additions. All24 combats win
and XP grows50740, but the export is diagnostic-only and no accepted loot yield
or native-ready checkpoint follows. No browser/runtime failure is observed.
The separate L12 rotation pilot also ends with four duplicate-ID pairs
(3789 objects/3785 unique IDs;52 object additions versus48 reported by ID).
The original acquisition's L12 export is unaffected:3737 objects/3737 unique
IDs and3344 farm-item additions reconcile. See the linked machine summary
for all three pilots' counts; keep later exports diagnostic-only.

## Evidence and cause

[Evidence and frozen script](../../docs/plans/evidence/p01-act1-earned-entry.md).
Raw root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-act1-earned-entry-eg5lmxdv/entry-l13`.
Unmodified `earned-l13.json` SHA256:
`2bea3abfd337af48f905e7d4e921d2121604fea3908c11ab377d4adb3813f4db`.
Raw report SHA256:
`f5c7dcc2a5f71b02585e956e8c3c0e266b94eba9b9a9ccb649e4b4b8521a84cc`.

`src/engine/loot/rollItem.ts` has module-local `itemSeq` and the existing
`seedItemSeqFromIds` helper. Normal `src/stores/persistence.ts` applies
`seedItemSeqFromHydratedSave` after loading backpack, stash, hero and merc gear.
The task script bypasses that allocator initialization when directly restoring
stores. Full-save equality does not observe this unsaved module state.

Preserve failed evidence unchanged. Before another service export qualifies,
restore the actual production allocator lifecycle and enforce object/unique-ID
and reward-count reconciliation. Do not mutate old IDs or replay merely to
replace a failed gameplay result. No runtime persistence patch is justified by
this evidence alone.
