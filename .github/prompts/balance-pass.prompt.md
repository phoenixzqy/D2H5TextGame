# Balance Pass Workflow

Use this when player feedback or sims show an out-of-band metric.

## Steps
1. **PM**: state the symptom in one sentence (e.g. "Necro summon DPS is 3× anything else at lvl 24").
2. **PM → qa-engineer**: run `combat-balance` skill across affected builds; attach report.
3. **PM → game-designer**: propose minimum-viable formula tweak; update `docs/design/...`.
4. **PM → content-designer**: adjust JSON if numeric values live there.
5. **PM → engine-dev**: implement formula change if needed; update tests.
6. **PM → qa-engineer**: re-run sim; confirm metric is in band; check no regressions on other builds.
7. **PM → reviewer**: review.
8. **PM**: ship.

## Guardrails
- Never change ≥2 dimensions at once (e.g. damage AND CD) — isolate variables.
- Document the *reason* for the change in the design doc, not just the number.
