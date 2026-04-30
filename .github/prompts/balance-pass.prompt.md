# Balance Pass Workflow

Use this when player feedback or sims show an out-of-band metric.

## Steps
1. **producer**: state the symptom in one sentence (e.g. "Necro summon DPS is 3× anything else at lvl 24").
2. **producer → qa-engineer**: run `combat-balance` skill across affected builds; attach report.
3. **producer → game-designer**: propose minimum-viable formula tweak; update `docs/design/...`.
4. **producer → content-designer**: adjust JSON if numeric values live there.
5. **producer → engine-dev**: implement formula change if needed; update tests.
6. **producer → qa-engineer**: re-run sim; confirm metric is in band; check no regressions on other builds.
7. **producer → reviewer**: review.
8. **producer**: ship.

## Guardrails
- Never change ≥2 dimensions at once (e.g. damage AND CD) — isolate variables.
- Document the *reason* for the change in the design doc, not just the number.
