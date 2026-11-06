# BUG-500 — Restore Bow Amazon pack damage growth

Status: Fixed locally, uncommitted; provisional potency, later-act balance open.
Severity: High. A maintained Bow build cannot pass the retained Act I frontier.
Owner: game-designer / content-designer; root implements and verifies locally.

## Reproduction

- Base commit: `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, existing private-v1 dirty source.
- Environment: Node 24.21.0 deterministic engine; no browser, viewport or locale involved.
- Seed: `2249554910`; native175 Dark Wood W4 exact party/resources/enemies.
- Restore `p15-bow-act1-level14-continuation-v1.json` lineage. Use the retained
  failed-wave input with Multiple Shot14/Magic Arrow1/Critical Strike1/Dodge1,
  constructed from its earned17-point budget, Multiple Shot-only priority.
- Resolve with current JSON growth+4/rank: hero dies at19.004s.

Expected: investing fourteen earned points in the advertised pack attack can
clear a level13 pack with the retained level14 party and resources.
Actual: growth+4 loses; growth+8 still loses at28.604s with911 enemy HP left.
JSON-only growth+12 wins at21.389s with181 hero HP and110 mana. Existing
Cold Arrow, volley control and Exploding Arrow comparisons also lose.

Evidence packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Files: `p15-bow-dark-wood-volley-comparison-v1.json`,
`p15-bow-volley-growth-eight-v1.json`, `p15-bow-volley-growth-twelve-v1.json`,
`p15-bow-exploding-existing-skill-check-v1.json`.
Input hash: `8cc2749668dfa272053508c11e44f0b3f2e70e7fa1c4e1273d10dd66f609d892`.

Root cause: flat physical skill growth leaves the invested pack attack weak
against this frontier's Defense and incoming damage. Correct its JSON curve;
retain existing targeting, hit checks, costs and monster contracts.
Workaround: no successful tested Bow allocation in the retained budget.

Regression: `src/engine/combat/amazon-multiple-shot-frontier.test.ts`.
Decision: `docs/plans/decisions/P15-bow-volley-growth-v1.md`.
Later-act Bow balance, holdout/pacing and fresh viability remain open.

Local validation,2026-10-31: original regression RED then GREEN;37 selected
Multiple Shot cases pass. Native428 clears all five Dark Wood waves after
earning level18, native429 clears Catacombs and claims Sisters once. Native430
starts Act II and loses Rocky Waste W4; that new frontier remains unresolved.
See `docs/plans/evidence/p15-bow-volley-growth-earned.md`. No commit was created.
