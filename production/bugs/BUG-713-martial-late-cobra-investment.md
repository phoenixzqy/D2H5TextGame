# BUG-713 — Invest late Martial points in its primary Cobra attack

Status: Locally fixed allocation policy with earned Normal-route validation; independent acceptance remains open.
Severity: Medium (players can allocate manually).
Owners: game-designer/level-designer; root implementation.

## Earned-route validation — 2026-11-04

[Earned Normal completion](../../docs/plans/evidence/p15-martial-cobra-normal-completion.md)
authenticates one actual native skill reset56ranks/free allowance3→2, Cobra6→12,
Tiger6→1 and Web1→0. Fixed gear/Prayer retained; subsequent earned growth takes
Cobra to17. All51 Act IV–V waves win with actual level50/next717, full main-quest
graph, Baal title and Nightmare unlock. Separate raw readbacks/cleanup pass.
BUG652 is locally resolved for intended progression. Combined reallocation and
native merc leveling do not establish isolated Cobra causality or population
balance. Earlier allocation-only scope and Open statements remain historical.

## Reproduction

HEAD b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus inherited human2 edits.
WSL/Node native allocation readback; browser, viewport and locale do not apply.
No combat seed consumed. Retained Plains708 is read, never replayed.

1. Read the canonical Martial targets in `tests/campaign/intended-growth-v1.json`.
2. Cobra stops at6 permanently, while subsequent targets purchase Tiger8.
3. Read the retained level49/next709 save and boss events: Cobra6, no free
   points, Cobra21 of52 hero actions; Izual draws with2,131Life remaining.

Expected: after the existing finisher/builder foundation, the late candidate
invests in its already first-priority attack using existing ranks and growth.
Actual: even unlimited future levels never raise Cobra beyond6. This is a
profile design gap, not proof that any replacement wins or that selection fails.

## Proposed correction and limits

Insert Cobra20 from40 after Cobra6 and before Tiger8. Preserve all earlier
allocation and priorities; no production tuning, implicit reset or free points.
A real skill reset removes inherited Shock Web because no target purchases it;
its resulting combo omission must be recorded, never described as Cobra alone.
No earned reset, admission, training, retry, gear/order search or renewed closed
attempt is authorized by this allocation-only slice. BUG652 stays open.

Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-martial-cobra-growth-vywwn1j9`.
Root retains originals, plan, checks and required evidence through unfinished
umbrella review, then owns exact cleanup and worktree release. No commit yet.

## Local result

Three legitimate behavioral REDs become green across nine affected cases.
Scoped strict types and explicit lint pass; original fixture and lint mistakes
are retained. Exact source readback proves the single target and unchanged
production files/earned source. See [evidence](../../docs/plans/evidence/p15-martial-late-cobra-investment.md).
No actual reset or campaign admission in this allocation slice; BUG652 stays Open.
