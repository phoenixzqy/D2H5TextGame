# BUG-662 — Retain complete native input in diagnostic wave records

- **Status:** Fixed and verified locally in the working tree; final integrated acceptance remains separate.
- **Severity:** High for reproducible balance diagnostics; no player save loss.
- **Owner:** root (diagnostic recording / QA).
- **Affected systems:** earned playback, P15 observations, raw recording comparisons.

## Reproduction

- Build: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce` plus retained uncommitted source.
- Environment: WSL/Linux, installed Node/Vite native diagnostics; browser,
  viewport and locale are not involved.
- Seed: retained Double Throw admission 706, run seed 3385400074, wave 0.

1. Inspect the retained `p15-throw-earned-act4-v1` journal in
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
2. Its wave observation retains teams, events and outcomes, but no full engine
   snapshot. A reconstruction from those teams omits `findPotion`.
3. Inspect the already-executed control in `p15-throw-attack-tuning-v1` beneath
   that packet. Do not execute it again or renew exhausted attempts.

## Expected

New native wave observations retain the complete serializable `CombatSnapshot`
supplied to that exact published recording before playback or settlement.
Missing, pending or mismatched bindings fail before effects. Comparisons include
the retained snapshot. Legacy records never acquire inferred skill authority.

## Actual

The original records corpse availability at 1180ms and Find Potion at 1728ms.
The reconstruction lacks corpse availability and casts Double Throw at 1728ms.
The first control diverged; no candidate wave or tuning was accepted.

## Evidence and bounds

`p15-throw-attack-tuning-v1/closure.json` records one control, zero candidate
waves, unchanged production data and exact restoration of the three trial tests.
`tests/sim/production/earned-playback.ts` omits the already-retained input from
`inspectRecordedWaves().currentPublished.binding.engineInput`;
`tests/sim/contracts/p15-wave-observation.ts` also drops it.

Fix future recording at the source. Never reconstruct historical skill authority,
rerun spent trials or treat serializable snapshots as opaque Battle Command
carry proofs. Native later-wave replay can require separate process-local carry.
No agent dispatch under the session constraint; root self-triages locally.

## 2026-11-03 — Complete native snapshot retained

New earned waves validate the published receipt against the active run, wave,
seed, recording identities and area metadata before playback or settlement, then
clone its complete `engineInput`. P15 observations preserve that snapshot through
the lossless journal codec; both raw-recording comparators include it. Historical
records retain visible absence instead of inferred projections. No production
combat formula, old recording or native save is changed.

[Evidence](../../docs/plans/evidence/p15-native-wave-input.md) records the
original REDs and final checks: 7 native cases, 2 constructed comparator cases,
5 observer cases and 8 quest-retention cases pass, with scoped strict types and
explicit eight-path zero-warning lint. Native coverage uses two successive
constructed Act IV waves with actual Find Potion and six mismatch refusals,
each preserving all observed combat/earned state. No campaign acceptance run or
protected-save replay occurs. The original Double Throw trial remains stopped.
