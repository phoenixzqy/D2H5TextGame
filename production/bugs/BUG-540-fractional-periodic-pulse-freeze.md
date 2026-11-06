# BUG-540 — Advance fractional periodic spell phases

Severity: Critical. Status: fixed; affected checks pass. Owner: root (engine/QA).
Build: feat/playable-foundations base9e0ef64, Fire Ball growth120 source040b76753435a97297e0ac88860fb4e96f7d2474f73d2ff5e1508fa15420c37c.
Environment: Node24.21 production deterministic combat, locale/viewport independent.

1. Restore actual Sorceress15/9139/123 retained Lost continuation; run the explicit
   diagnostic25 owned-heavy Arcane forecast. No diagnostic state is earned.
2. Third settled wave attempts to stage wave index3, seed3228030938.
3. Fire Wall applied1842.9845385961391ms schedules2842.984538596139ms. Subtraction
   returns999.9999999999998; division/floor schedules that same boundary again.
   Age modulo also rejects the legitimate pulse.18 actions and clock2842.984538596139
   repeat indefinitely, never reaching the60s game deadline.

Expected: each representable paid pulse settles once, then the scheduler selects
its next strictly future phase. Ordinary fractional action timing must not freeze.
Actual: original bounded forecast times out120s. Diagnostic in-memory instrumentation
throws after20000 iterations at that exact stable clock, without fabricating a result.
Evidence in packet d2-counted-source-z3jj3xa1: arcane-earned-gear-forecast-v1-run-exit.json,
p15-sorceress-fire-act2-arcane25-loop-diagnostic-v1.loop-diagnostic.json and its
explicitly instrumented launcher. The full actual engine input is retained there.
Affected: periodic-spells next phase and combat pulse recognition for Blaze,
Fire Wall, Thunder Storm and Inferno. No save/data/skill identity change needed.
Root: quotient floor and remainder are inconsistent with rounded absolute timestamps.
Workaround: none accepted. Projected25 progress remains discarded; native15 save intact.

Resolution: next-pulse scheduling compares reconstructed absolute phases and always
selects a strictly future timestamp. Combat recognizes the same reconstructed pulse
instead of using age modulo. All four periodic spells have fractional-time regression
coverage; 324 affected checks pass, including the final40-case timing file. Scoped
strict types/lint pass. Exact transition: p15-periodic-phase-source-binding-v3.json.
The later earned25 Arcane continuation completed all six waves without a freeze.
Historical timeout and instrumented diagnosis remain retained as failures/evidence.
