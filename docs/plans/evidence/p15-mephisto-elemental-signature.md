# P15 — Mephisto casts all three native elements

2026-11-05. BUG749 fixed locally. Full private v1 remains incomplete.

The chapter override discarded the archetype's cold/poison skills. Restoring
the list alone still starved Poison Cloud: at AS120, Frost Nova's3s cooldown
was ready every second1540ms action. Both failures were reproduced in native
manual and idle chapter plans before the correction.

[The decision](../decisions/P15-mephisto-elemental-signature-v1.md) restores
Frost Nova/Lightning/Poison Cloud and gives Mephisto a4s Frost Nova cooldown.
Optional schema-validated monster metadata carries canonical cooldown seconds
through the factory into ordinary execution. The factory copies/freezes it;
absent keys keep rank-derived shared timing. Hero/merc/summon metadata cannot
activate the override. No save format change is involved.

## Observed behavior and scope

Seed13 native chapter plans, ordinal450, show cold1540/lightning3080/poison4620
and cold6160/lightning7700/poison9240ms. Cold/poison attempt every party role;
actual successful hits apply Chill/Poison. Lightning's first cast targets one
unit and native combat applies Paralyze. Ordinary miss rolls remain enabled.
Targets are deliberately durable synthetic hero/merc/summon controls; this is
behavior verification, with no earned-build or balance inference.

Mephisto retains33600HP/300Attack/360Defense/AS120 and the original chapter/drop
source. Input/wave immutability, deterministic construction, recorded/plain
parity and repeated recording equality pass. Shared Frost Nova stays3s; missing
or unrelated override keys use its original timing. The actual loader accepts
valid metadata and rejects malformed maps, aliases, non-monster IDs, nonnumeric,
nonfinite and subsecond values.

## Verification and self-review

- `red-missing-skills.log`: both native modes fail before chapter-list restoration.
- `red-poison-starvation.log`: both modes fail after list-only restoration.
- `green-final.log`: all8 focused engine/native/schema cases pass.
- `related.log`:19 existing affected cases pass;49 outside the explicit spell/
  Act III filter are not run. No other-act encounter is replayed.
- `types-final.log`: strict scoped TypeScript,600 implementation/data files,
  zero diagnostics. The check includes the repository's existing Vite declarations.
- `lint-final.log`: all7 changed TypeScript/test files pass.

All final handles7993/30577/71497 exited0; prior related handle34751 exited0.
Earlier test-oracle/typing failures are retained. The corrected hit oracle
respects native85% base hit chance, and the final typing fixes use the existing
typed catalog, explicit optional-ID validation and discriminated-event narrowing.
No assertion, compiler option or lint rule was disabled.

Root self-review compares every production file to the packet's pre-change
snapshot. The exact data delta is the three-skill chapter list and one cooldown
map; stats, rewards and all other JSON fields are unchanged. Engine changes are
limited to the optional contract, copied metadata and cooldown lookup. No
material finding remains in this correction. This is self-review only; final
independent/owner acceptance remains open. Poison immunity and the older
three-stack Poison Cloud requirement remain separate unresolved contracts.

## Custody and continuing work

Exact retained packet:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-mephisto-signature-zepx0gpm`.
It contains baseline/final source snapshots, exact hashes/diff, genuine REDs,
intermediate/final check logs and `closeout-inventory.json`. Root retains it
through full-v1 acceptance and then removes that exact path. All task check
processes are terminal; no browser/server, task-local cache or disposable
artifact remains. Shared tool caches were preserved.

Historical14/14 intended Normal completions,210 supplemental sources and formal
balance0/210 remain unchanged. No completed campaign, population, exhausted
sample/retry allowance, broad suite, build or CI was rerun. Natural pacing,
acquisition/economy, build fairness, difficulty/endgame and integrated app/owner
acceptance remain open. Browser works; CI is excluded; no user answer is pending.
