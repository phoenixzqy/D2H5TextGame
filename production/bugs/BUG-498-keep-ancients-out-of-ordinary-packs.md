# BUG-498 — Keep the Ancient bosses out of ordinary campaign packs

Status: Fixed locally; final combined-source integration remains pending.
Severity: Medium — slows single-target builds before the actual quest boss.
Affected systems: Act V content; campaign balance.

## Reproduction

Build: b5a0898806bfba369a2d84a1b6c41d0bbb057fce, dirty production source cd61069b57eefdf5141b6b1c029386fc14854f5bb9f72159dca6d387c1cd0beb. Node24.21.0/WSL native stores; browser/viewport/locale N/A for this engine reproduction. Captured native run seed and ordinal are in p15-necro-ancients-exact-input-v1.json.

1. Restore the earned Necromancer52/26-area/61-action checkpoint.
2. Enter Ancients' Way normally, keeping the already-started Rite quest.
3. Observe the opening ordinary wave at native1559/1560/1561.

Expected: ordinary packs use campaign enemies; the three Ancient Barbarian bosses retain their separate Rite encounter, matching docs/design/monster-spec.md's Boss role and compact-act5-contract.md's exact three-member boss recipe.
Actual: w1 and w3 use the boss-only ancient-barbarian as ordinary/elite pack members. Challenge scaling expands w1 into ten Ancients plus ten Shamans; recorded1559 opening HP totals249,985 before the actual boss encounter. Control survives but draws. Three learned-curse order comparisons on only the exact1560 failed wave also draw; no farm/grant/seed grid or campaign credit.

## Root correction and acceptance

Replace only the two ordinary/elite Ancient entries in Ancients' Way with the existing barbarian-savage campaign archetype. Retain authored counts, encounter IDs, levels, wave structure, loot, other areas, monster stats and the exact three-Ancient boss recipe. This corrects role placement instead of weakening boss stats, raising combat caps or repeatedly farming around it.

Verify the actual JSON/schema, generated ordinary packs and unchanged three-boss recipe with a focused Act V regression; then resume only the unfinished Act V route from1562. Final fourteen-build/pacing acceptance remains open.

Security check: pass. Local data-role correction with existing IDs; no dependencies, credentials, authority/proof changes, save migration, network or publication. No agents/CI/installs/commits/remote changes.

Evidence packet: /home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1. Root retains p15-necro-act5-confuse-continuation-v2, p15-necro-act5-amplify-continuation-v2 and p15-necro-act5-reflection-continuation-v1 reports/journals/receipts, exact-input-v1.json, p15-necro-ancients-curse-preview-v3.json and bug498-before-act5.json through umbrella QA; root owns eventual disposal.

## Result

Exact source delta replaces only w1/w3's ordinary Ancient references. Three role/schema/generated-plan regressions fail before the fix. All9 focused role/Act V admission tests pass; after optional-field typing correction, the changed schema case passes individually and scoped types/lint pass. Unchanged cases are retained rather than rerun.

Native1562 now wins W1–W6 in9.700/19.468/11.640/15.520/39.104/36.860s. W7 draws against the unchanged three bosses; no Rite Claim or area clear is fabricated. Source/data/quest/economy/point/export audits pass. Latest earned state52/XP1,821,210/next1563 retains26areas/61actions. This closes ordinary role placement; boss throughput remains a separate balance question.

Additional exact evidence: bug498-ancients-role-red-v1, bug498-act5-focus-green-v1, bug498-corrected-schema-focus-v2, bug498-scoped-types-v1/v2 and bug498-scoped-lint-v2 logs/receipts; bug498-scoped-tsconfig-v1.json; p15-necro-act5-ancients-role-continuation-v1.ts/.mjs/.json/.raw.jsonl.gz/.log/-exit.json. Source preimage and failed diagnostics retained; all owned groups terminal and task Vite caches absent. Root retains these leaves through umbrella QA and owns eventual disposal.
