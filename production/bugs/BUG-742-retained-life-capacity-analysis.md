# BUG-742 — Account for life-capacity events in retained pressure analysis

- Severity: Medium; valid summon/aura combat cannot be analyzed by the copied reader.
- Status: Fixed locally in retained analysis v2; native gameplay unchanged.
- Owner: root acting as qa-engineer; no delegation.
- Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce plus existing human2 changes.
- Environment: Python retained-output analysis on WSL; no browser/locale applies.
- Seed: Druid Tomb ordinal115, run seed4160859813.

Reproduction:
1. Use the already completed `summoner-route-first-v1` report/journal in
   `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-act2-caster-summoner-p59d92kj`.
2. Run its frozen `summoner-route-first-v1-analysis-v1.py` after passing readback.
3. Observe line15 reject initial life526/base capacity511 and final capacity526.

Expected: reconcile explicit native `life-capacity` events and distinguish
capacity projection from skill/orb healing; reject corrupted capacity/life.
Actual: copied analysis assumes constant maximum life throughout the wave,
ignoring the time-zero summon/aura capacity projection.

Affected: external pressure analysis only. Native report/save are unchanged;
the complete reward/custody readback already passes. Preserve original failure,
version the analysis, exercise capacity mutations, and do not replay gameplay.

## Fix and verification — 2026-11-05

`summoner-route-first-v1-analysis-v2.py` in the same retained packet now consumes
native `life-capacity` events, validates old/new capacity and life, and accounts
capacity withdrawal clamping separately from effective skill/orb healing. The
time-zero Oak Sage projection to526 is valid and does not create healing.

The original v1 failure and command exit1 remain. Version2 exits0 with passing
`summoner-route-first-v1-analysis-v2.json`, including five corrupted-capacity
controls, four effective-orb controls and a full-life no-op-orb control. Duriel's
hero accounting reconciles526entry−60incoming+26orb=492final, minimum466 and
final capacity526. The separate complete reward/save/custody readback already
passes. No source save, frozen manifest or native outcome was rewritten, and
no combat was replayed. This is root verification, not independent final QA.
