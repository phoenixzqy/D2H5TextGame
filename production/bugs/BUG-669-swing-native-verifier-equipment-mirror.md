# BUG-669 — Account for the native hero equipment mirror after a swap

- **Status:** Locally resolved for future verifier captures; the original missing
  terminal export remains a historical evidence limitation.
- **Severity:** Medium; native preparation verification is incomplete.
- **Owner:** Root; retained-save diagnostic driver, not production equipment.
- **Affected systems:** External preparation expectations and terminal evidence capture.

## Reproduction

Build `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus current retained worktree.
WSL/Linux Node/Vite SSR; no browser, viewport or locale exercised. No combat or
RNG draw occurs, so no combat seed applies.

1. Restore the actual partial Swing export
   `7acaff5c072833202d0e96b31abf0bb3ecddbe84199f0059c911f51f00219850`,
   preserving its 33 prior staging transfers.
2. Execute the one planned native skill reset, allocate 56 points, set the
   accepted combo, and equip backpack sword `it-7web3-2gu` once.
3. Observe `{ ok: true }`, then the whole-save assertion failure.

## Expected and actual

Expected: reconstruct the successor including every native save projection,
and retain terminal evidence before assertions can throw.

Actual: the expected object retains the old `player.equipment` mirror while
`src/engine/save/serialize.ts` rebuilds it from `inventory.equipped`. The
assertion reports the unique sword in actual versus the former set sword in
expected. It throws before terminal export/projection capture; isolated stores
are then restored. Native equip itself returned success. The original launch
remains failed, with no captured whole terminal save and no replay authorized.

## Evidence and recovery boundary

Packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1/p15-swing-sword-native-v1`.
`before-equip.json`, `allocated.json`, `admit-equip.json`, `equip-action.json`
and `process-exit.json` retain the actual observations.

Do not rerun reset, allocation, equip or combat. A separate bounded accounting
recovery may reconstruct the deterministic successful swap with native pure
composition and save serialization, validate custody and export roundtrip,
and correct the verifier for future work. Label that artifact reconstructed;
it cannot retroactively become an observed terminal export or an earned clear.
The original staging and encounter budgets remain spent.

## 2026-11-04 — Recovery checked; original capture remains unavailable

Pure native equipment/stat/save composition reconstructs the observed successful
swap without repeating reset, allocation, equip or transfer. Isolated native
restore/snapshot/export/decode and the separate accounting reader pass whole-save
conservation, all418items, Life150/Mana65 and the expected391Attack projection.
`reconstructed-native-export.json` SHA256 is
`19841b5a5b8df6a6e92325d308840b3c0179e14c04c2059c23f056ee0786ce99`.
Two negative conservation controls pass. No combat/admissions/rewards occur.

`corrected-driver-unexecuted.ts` normalizes expected state through native
`buildSave` and writes terminal artifacts before assertions. It remains
unexecuted; do not repeat original actions to make the failed launch green.
The reconstructed artifact is not an observed terminal export. Status remains
Open for the original missing capture and unexecuted future verifier correction.
[Combined evidence](../../docs/plans/evidence/p15-swing-sword-combination.md).

## 2026-11-04 — Future capture correction verified without repeating original actions

[Verifier and forward evidence](../../docs/plans/evidence/p15-swing-verifier-forward-diagnostic.md)
tests the extracted future-driver capture helper on constructed native stores.
It captures the actual snapshot, export and projection before conservation
assertions and compares expected state through native `buildSave`. All three
regressions fail under original logic and pass after correction: canonical
equipment mirror, retained terminal evidence on a currency mismatch, and
rejection of a missing owned item while still retaining actual evidence.
Final scoped strict types and explicit two-file lint pass.

Only the helper is exercised; the original reset/allocation/equip sequence and
the future driver's full `main` are not rerun. Original failure logs and the
reconstructed export remain unchanged. The missing original observation cannot
be recovered retroactively. A separately capped forward diagnostic clears Acts
IV/V with reconstructed ancestry and does not establish earned continuity.
The future-verifier defect is locally resolved; BUG659's earned-build acceptance
remains open.
