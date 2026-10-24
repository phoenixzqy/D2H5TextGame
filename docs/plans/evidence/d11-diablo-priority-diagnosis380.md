# D11 — Diablo priority diagnosis at earned next380

2026-10-24. Root diagnostic execution/artifact audit, no independent acceptance.
The genuine level31 [save through379](d11-earned-tyrael-and-river-through379.md)
is unchanged: decompressed SHA256
`b0972bad81133bba925939ed6c412307e2338df2e65795a2f6b48fa70735a64f`,
nextNormal380. No genuine launch, equipment/point/reset spending, quest action
or campaign advancement occurs. Never resume a diagnostic projection.

The hypothesis that Static Field keeps paying after its difficulty floor is
unsupported: `combat.ts` checks `staticFieldDamage > 0` in `hasAvailableEffect`
before payment. Normal's authored fraction is zero, clipped to1HP; Nightmare's
separate floor is33%. No selector or damage patch follows from this inspection.

Three priorities are frozen before16 paired independent seeds, derived with
`hashSeed('diablo380-priority-only-v1:' + index)`, index0–15. All other inputs
remain the retained actual character and equipment, with no allocation change.
Each diagnostic starts the actual full Chaos plan at ordinal380 and stops at
its first native nonwin. Source includes the pending runeword-base addition;
the archive's911file manifest records its exact state.

| Priority | Full clears | Reached Diablo | Last-wave defeats | Last-wave draws |
| --- | ---: | ---: | ---: | ---: |
| Static Field → Frozen Orb (retained) | 0/16 | 16/16 | 15 | 1 |
| Frozen Orb → Static Field | 0/16 | 16/16 | 13 | 3 |
| Frozen Orb only | 0/16 | 0/16 | 0 | 16 |

Orb-only times out at wave5 in14 runs and wave6 in2. Last-enemy life in those
runs is not Diablo's life and must not be compared as boss damage. None of
these policies qualifies for genuine preparation; this is diagnosis, not a
balance certification or an alternative to the unchanged32-seed selection rule.

In the first retained-policy seed's full Diablo recording, hero entry is
530/530HP and392/392MP, with14.112MP/s regeneration. It casts five Orbs, five
Static Fields and ten basics, dealing994cold,11249lightning and445physical
damage. At11.161s, a573physical critical kills the hero while341MP remains;
Diablo retains31476HP. This inspected defeat establishes adequate mana there,
not every defeat's cause. Priority changes alone do not fix the observed
survival/damage problem. No numerical tuning or established engine defect is
claimed. Next investigate survival-oriented earned builds and the actual boss
damage/time limits, preserving all failures and existing acceptance thresholds.

The [summary](fixtures/diablo-priority-diagnosis380/summary.json) checks all48
ordered projections and source-save conservation. The
[manifest](fixtures/diablo-priority-diagnosis380/manifest.json) verifies six
retained files, including the frozen policy, exact seeds, native wave summaries
and both first-seed Diablo recordings. Archive86034bytes is checksum-verified.
Run `node priority-screen.mjs` from its retained raw directory to reproduce the
diagnostic on the matching source; session40695 terminated exit0. No browser or
server listener was started. The exact owned Vite cache is removed and absence
verified, cleanup remaining[]/failures[]. Root retains raw evidence at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/diablo-diagnosis380`
through campaign/full-v1 consumers, then removes that exact directory. C2–C4,
213-skill, pacing and full G0–G7 acceptance remain incomplete. Local only.
