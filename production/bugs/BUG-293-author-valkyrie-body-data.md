# BUG-293 — Author the complete Valkyrie body in validated JSON

- Severity: Medium; the body works, but its base tuning violates the mandatory JSON data boundary.
- Status: Fixed in fcf8503c; bounded native/public/lifecycle proof in a75e1036 and d90c002f. Combined support gate/retention pending.
- Build: ae60f9cd before extraction; contract D06-amazon-valkyrie-body-v1.md.
- Environment: local Node/Vitest; both locale previews share the same pure stat lookup. No viewport or RNG needed for the static body factory; existing actual native support controls use seed7 at ranks1/20.
- Affected systems: engine-dev/content-designer, shared summon factory and skill preview.

## Reproduction

1. Inspect src/engine/skills/summons.ts baseStatsForSummon('valkyrie').
2. Observe the hardcoded 200 Life, 40 Attack, 20 Defense and inherited hardcoded baseSummonStats values.
3. Run the retained valkyrie-before-extraction compatibility test: literal rank1/6/20 body and preview controls pass, confirming the existing values to preserve.

Expected: all Valkyrie body tuning is declared completely in strict schema-validated JSON, consumed once by the shared runtime/preview lookup. Existing rank growth, payment, eligibility, magical mitigation and combat behavior stay unchanged.

Actual: editing the body's stats requires changing engine TypeScript; no complete authored Amazon body definition/schema exists. The native paid summon itself already works; this bug does not claim otherwise.

Root cause: Valkyrie is a remaining hardcoded branch after Druid and Necromancer bodies moved to validated JSON. Workaround: edit engine code, which is not an acceptable final data boundary.

Evidence: src/engine/skills/summons.ts baseStatsForSummon and baseSummonStats; retained task /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-amazon-support-ssrbktv_/valkyrie-before-extraction.json/log (3 passing literal controls), valkyrie-definition-external.json/log (24 prototype checks). These prototype checks are not yet branch-integrated acceptance.

## Planned correction

Add the complete Amazon summon data/schema and pure validated copying loader; route the existing shared factory/preview lookup to it and remove only the Valkyrie numeric branch. Five source paths; preserve existing JSON skill growth. Verify finite/complete/closed data, independent mutable runtime copies, literal rank oracles, actual buildSummon equality and affected/native/static/engine checks. No balance retune, save migration or skill-inventory credit from data extraction alone.

## Verification

See [Valkyrie evidence](../../docs/plans/evidence/d06-amazon-valkyrie.md) for strict data/copy tests, unchanged literal bodies, full engine and focused static checks, four production browser contexts and real-store next-wave/save proof. Original failures and interrupted-build records remain retained. No balance retune, independent acceptance or new inventory credit claimed.
