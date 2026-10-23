# Act III: three functional quest flows and Council proof

2026-10-23. Local branch `feat/playable-foundations`; final validated source
`3233e7b199b18ecafa783177db58940d4e664bfa`. This implements Golden Bird, Blade
of the Old Religion and Lam Esen's Tome under the
[frozen compact contract](../decisions/D11-compact-act3-contract.md). Council
proof admission is a prerequisite for the remaining Khalim flow. Khalim,
Guardian/Orb/Mephisto, earned Act III, C2–C4 and full G0–G7 remain open.

## Resulting behavior

- Blade: clear prerequisite, explicit Recover actual Gidbinn, explicit Give
  Ormus, then separate Claim: 5000 hero / 3750 fielded-merc XP and exactly one
  deterministic legal ilvl34 unique ring from the frozen four-member profile.
- Tome: clear prerequisite, explicit Recover actual Tome, explicit Give Alkor,
  then separate Claim: 6000 / 4500 XP and five unspent stat points, without
  automatic allocation.
- Golden Bird: clear prerequisite, Recover Jade, Give Cain consumes Jade and
  creates the actual Bird, Give Alkor consumes Bird, then Claim: 4000 / 3000 XP
  and an owned Potion of Life. Claim grants no Life directly. Read consumes the
  exact Potion once, adding 20 maximum Life without healing or XP. Shared stat
  composition and restoration use the real consumed-source graph.
- Opening an NPC does not hand in an item or cascade objectives. Exact source
  ownership, staged prerequisites, guarded transactions and save validation
  apply. Explicit claimed-history reward recovery requires the real hand-in
  graph and never repays XP; flags alone create no item or Life entitlement.
- Council proof: capture and freeze the original canonical Travincal encounter
  and all three original member IDs before recording. Only the accepted live
  settlement with all three dead, the living original hero and eligible
  pre-event Khalim progress publishes the finite Council action receipt.
  Replay preserves original provenance. Historical claimed recovery requires
  an explicit new encounter mode; import/old clears never infer proof.

Implementation commits: `5976b0e`/`0f218e3` (Blade/Tome), `ead6f6b`/`d755c84`/
`2401499` (Golden core/catalog/UI), `107d0f2`/`965bb8c` (browser assertions),
`93d6867` (BUG-102) and `3233e7b` (Council, agent source `b09895d`). Historical
fixture corrections are `1bd8936` and `0405bd2`; frozen v14 validation remains
unchanged. No Flail/Will/Orb runtime acceptance follows from Council admission.

## Validation

| Check | Result |
| --- | --- |
| Final full `npm test -- --cache=false` | 9393 tests / 324 files PASS; 228.25s Vitest / 229.99s wrapper |
| Final `npm run test:engine` | 4448 tests / 119 files PASS; 63.44s |
| Integrated Council + Life focused | 57 / 4 PASS |
| BUG-102 pure + unchanged affected callers | 271 / 5 PASS |
| Final typecheck and full lint/purity | PASS |
| Final production build, `VITE_E2E` unset | PASS |
| Final emitted JS forbidden-debug-token scan | all seven files clean |
| Full-run source/tool/HEAD integrity | 955 files unchanged; HEAD unchanged; status unchanged |
| Three-flow production browser | 20 / 20 PASS; 158.94s; zero skipped, unexpected or flaky cases; errors [] |

The browser run used the integrated three-flow source before BUG-102 and Council
were added. It does not claim a browser rerun of final head. Those later changes
have focused and final full-suite coverage; no positive quest-flow behavior was
changed by BUG-102. Browser inputs are **constructed functional fixtures**, not
earned campaign progress. Both zh-CN and en run at 360×640, 412×915, 640×360,
1280×800 and 1920×1080 with reduced motion. The production preview exposes no
debug bridge. Assertions cover each explicit stage and owned/consumed source,
no hand-in XP, exact reward deltas, frozen seeded ring properties, no-heal
Potion Read, repeat refusal, keyboard activation, accessible names/status,
44px controls, no horizontal overflow and exact Save→close→new-page Continue.
The retained packet has 60 PNGs and 80 saves. Mobile Potion screenshots were
visually inspected in both languages.

The first frozen integrated full run at `965bb8c` had 9330 passes and nine
failures: BUG-102's new Life arithmetic check affected zero-entitlement
malformed-level summon paths. Two additional pure regressions reproduced it
before the minimal positive-entitlement guard fix. Existing caller tests were
preserved. The subsequent full run above is green. Earlier stale historical
delivery fixtures were corrected independently; they are not the BUG-102 cause.
Suite-time budgets remain exceeded. Existing production build warnings about
chunk size, Browserslist age and oversized asset-manifest precaching remain.

Independent read-only QA approved Golden core, reviewed browser assertions
(missing stage assertions were added before the passing run), and approved
Council plus BUG-102 with no actionable security/correctness finding. UI agent
reported 78 focused tests plus types/scoped lint/locales passing. Reviewers did
not rerun root's full/browser suite; those results are root-owned evidence.

## Progress and retained evidence

Earned evidence remains Act I's genuine 310-wave clear and partial Act II
Staff/Sun/insert/Far Oasis progression, ending at the actual Radament draw.
There is no earned Radament/Book/Arcane/Duriel/Act III or C2 acceptance. These
three functional flows do not reduce the full seven-class, 213-skill, Acts I–V,
economy/crafting/endgame and 30–50-active-hour objective. Next is actual Khalim
component/Will/Orb progression and post-Orb qualified Mephisto, followed by the
remaining campaign and system acceptance work.

Exact retained root:
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-a3-delivery-clenw50l`.
It holds browser reports/manifests, `golden-retained-evidence/`, RED/GREEN/full
logs, freezes/results, scan receipts and cleanup receipts. Root owns removal
after Act III and umbrella consumers finish. This is required diagnostic
evidence, not a disposable build. All root test/build handles are terminal;
previous owned preview ports are closed. Exact task-owned `dist`, browser-output
directories, `golden-dist` and final `council-dist` were removed and their absence
verified; cleanup receipts report no remaining disposable paths. Shared caches
and installed tools remain. Implementation stays in the claimed worktree;
no push, PR, merge or deployment was performed.
