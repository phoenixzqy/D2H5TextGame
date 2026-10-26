# BUG-257 — Refresh the Poison Explosion fixture's Dagger oracle

Status: fixed locally in `69a3bb9e`; final frozen full/native compatibility passes.
Severity: Medium — one required integration test assumes the known Dagger defect.
Date: 2026-10-26. Root author only; independent acceptance remains open.

## Reproduction

- Commit: `2e29ede8`, with the four pending Poison Dagger presentation paths.
- Environment: Linux, Vitest/jsdom, real native stores and engine. Browser,
  viewport and locale are not applicable to this numerical integration test.
- Seed: `7`, challenge ordinal `0`, synthetic level18 Necromancer with Dagger1
  and Poison Explosion1, explicit unearned survival/mana equipment.
1. Run the canonical 13-file Dagger/Poison Explosion/Nova compatibility selection.
2. In `src/stores/poison-explosion-native.test.ts`, execute
   `uses a real first kill before the first native Poison Explosion and pays ordinary MP`.
3. Compare the survivor's complete periodic event list against its old literal.

Expected: exact periodic events reflect the newly authored Dagger potency while
preserving corpse eligibility, payment, Poison Explosion and spread invariants.

Actual: the assertion expects `[[7700, 2], [9000, 13]]`, but receives an additional
`[7500, 1]` event. Its adjacent comment explicitly says Dagger's marker has no
potency. The focused run has399pass/onefailure across13files in25.935s.
This observation alone does not establish the additional event's causal source;
inspect the recorded actions, statuses and HP before changing the oracle.

## Evidence and ownership

Root retains the original canonical log and receipt under
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-poison-dagger-ujbpvvn4`:
`canonical-presentation-focused.log`, SHA256
`0461d5bef9d54f669d2e2d64c2e4e01264a81645e8d9e1e923b884de6b4a5e1c`.
The unchanged original test and a trace-only external reproduction are retained
there too. Keep the failures through BUG256/BUG257/full-v1 evidence consumers;
root owns later lossless retention/read-back and exact task cleanup.

Affected systems: native Poison Explosion regression oracle and Dagger
compatibility. Root owns diagnosis and correction; no delegation or campaign
action. No runtime workaround, skipped assertion or weakened comparison is
authorized by this report. Verify the actual event cause before a test-only fix.

## Diagnosis and local correction

The trace-only reproduction repeats the original assertion failure. At6000ms
Dagger Poison spreads from the first real death to the survivor with one stack,
1HP/s and expiry11000ms. At7500ms the integrator settles1HP before PE casts.
PE is dodged by that survivor; the original7700ms/2HP and9000ms/13HP events
remain. The full literal is now `[[7500, 1], [7700, 2], [9000, 13]]`.

The correction retains every old assertion and adds exact source/rate/expiry
and pre-cast ordering assertions. Canonical compatibility passes400/13files
in24.506s; the final explicitly narrowed death witness passes18/18 in8.523s.
No engine, fixture, resource, timeout or skip changed. The first added witness
accidentally selected the initial empty0ms status; its predicate now selects
actual damaging Poison while preserving the6000ms/source/rate expectation.
That authoring failure and an external workspace file-allowance failure remain
retained with the original failure and full trace.

## Final verification

Frozen `bee044a8` full18100/834/two existing opt-in skips, final types/lint,
explicit PWA lint and final public4/4 pass. Original failures remain retained.
See [current evidence](../../docs/plans/evidence/d04-poison-dagger.md) for exact
results, source/build/save audits and visual limits. Independent/earned/full-v1
acceptance remains open; no runtime or test-limit workaround was introduced.

## Retention closeout

All2332raw members archived/read-back verified, then2332exact disposable files/
40directories and the driver removed; remaining[]/failures[]. Historical raw
paths above now identify archive provenance. Required archive/four-path retention,
original failures, individual visuals and one bounded credit are linked from
[final evidence](../../docs/plans/evidence/d04-poison-dagger.md). Root owns eventual
retained-evidence removal after BUG/full-v1 consumers finish.
