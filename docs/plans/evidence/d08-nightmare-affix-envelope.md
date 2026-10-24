# D08 — Nightmare affix envelope

Root implementation/self-review; independent acceptance pending. Production
TypeScript remains unchanged from76a8436. The correction changes exactly16 last
tier `ilvlMax` fields99→102, eight per pool. Restoring only those fields recovers
the complete original parsed documents. No weights, values, minima, IDs, base
requirements, lower tiers or previously generated item payloads change.

The actual production `rollItem` repro on Archon Plate, seed3286157777, changes
magic/rare100,101,102 from0/0 bonuses to2/6. Level99 remains2/6 and103 remains0/0.
All75 affixable bases are exercised at99–102 for actual magic/rare kind/count/
applicability/tier/value legality. Every authored affix has exactly one legal
tier at each integer1–102;103 is excluded. Actual caster-amulet requests at
99–102 pass through normal costs, source-level/identity preservation and
once-only receipt replay. Closed Ajv2020 validation passes for all16 definitions.

Corrected causal RED:25 failed/5 controls passed before data edits (1.46s).
The first RED also exposed a test-only absent-versus-undefined property error
on the99 caster control; separate value comparison fixes it before the causal
RED. Both logs remain. Focused157/4files PASS; final30/1 PASS. Engine5668/173
PASS68.57s. Strict typecheck, final full lint, production build10.90s and all4
production JS bridge scans PASS. Lint initially flags a redundant narrowed-kind
guard in the new test; removing that unreachable guard changes no assertion or
production behavior. Full units PASS11502/439files with2 existing skips,
exit0,420.78s. No required tests are disabled or weakened.

Separate before/after actual item generation covers14850 deterministic calls:
all75 bases × magic/rare × every integer level1–99. The complete serialized
item stream has unchanged SHA256
`2cb99034466d1fc84a295119816c6ac9de307c883cdceca9dd05e5d8c87655ba`.
This is seed3286157777 compatibility evidence, not every possible RNG state.

Corrected raw prefix SHA256
`80ad25be3f181c7507d7b7cdeaa9091bbcf57d8766cd5dfc32c05d3852f64a72`;
suffix `8a07352970434ba9175579323f1594ad081dfae4a7385ec42a07f01d57c8f414`.
No earned save is manufactured from these isolated materialization calls.

Raw audits, scripts and all failed/passing command logs remain root-owned at
`/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop`
(`bug153-*`) through full-v1 consumers; root removes them afterward. The
disposable `dist269` build served the owned earned-campaign preview. Its
browser exits0, preview97330 exits130, port4417 refuses connections and the
exact build directory is removed/absence verified. Existing suite-time,
bundle/PWA warnings and full G4/build/economy acceptance remain open. Local only.
