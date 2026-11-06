# BUG-428 — Replace fixed monster Frost Nova and Arcane Bolt stubs

Status: fixed locally; numerical/campaign acceptance remains open. Severity: high (progression/balance).
Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce + retained private-v1 work.
Environment: WSL/Linux, Node24.21.0 production-store campaign runner; both locales,
no browser/viewport dependency.

## Reproduction

1. Use the existing fresh sorceress-cold Act I route, fixed creation Date1793304000000,
   no supplied seed, recovery none, at most40 Blood Moor W1 farms.
2. The earned L6 party enters Den ordinal40/runSeed2494876480, wins W1/W2,
   and loses W3. Retain every reward and inter-wave carry.
3. Inspect the native registry and compare these spells on L3/L7/L90 monsters.

Expected: authored monster spell damage follows a coherent monster-level curve,
without allocated-rank, player-level or tier-Attack amplification. Early elite
affixes should not inherit the same flat spell power as late campaign casters.
Actual: Frost Nova remains a20–30/3s/all-enemies stub; Arcane Bolt remains a
25–40/1s/single-enemy stub. Their JSON advertises30–50 and45–65/2s respectively;
neither native damage scales with monster level. DenW2 takes the hero180→49HP
despite four real9HP orbs, then W3 kills both allies. This single route does
not establish that every preparation/build fails.

Evidence: external packet p15-opening-budget-act1-v1/sorceress-cold.json and
compressed journal; p15-elite-attrition-study-v1.json exactly replays all three
observed Den recordings/results. Frozen-component32-seed diagnostic: W2 native
8wins/24losses; proposed level spells24/8; halved elite life23/9; combined31/1.
All W3 components still lose from original49HP carry. These are isolated
components, not continued or earned campaigns. No elite-life change is selected.

Affected systems: content-designer/game-designer/engine-dev/QA; root sole writer.
Recovery is present and must not be reported absent:36HP of W2 orbs offset167
incoming damage (including52periodic). Next: implement the recorded two-spell
curve, native regressions, and one fresh unchanged earned route; retain nonwins.

Resolution: validated immutable JSON projections and actual monster-level
direct-hit growth implemented. Final702consumer cases/types/lint/build and
public Chromium2cases plus192constructed browser probes pass. The unchanged
earned cold route improves DenW3 entry49→97HP but still loses. Full engine
sweep14282PASS/2staleFAIL; BUG429/430 correct those pre-existing oracles and
complete affected four-file rerun137PASS. Original failures retained. See
`docs/plans/evidence/p15-monster-cold-arcane-level.md` for limits and artifacts.
