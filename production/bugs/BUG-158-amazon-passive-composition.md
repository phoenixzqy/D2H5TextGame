# BUG-158 — Apply authored Amazon passives to native combat stats

Status: fixed and locally verified; full-suite result and independent acceptance recorded in the linked evidence.
Severity: High — three learnable passive skill paths grant no combat benefit.
Owner: engine-dev / frontend-dev / QA; root is the sole writer.

## Reproduction

Runtime `6faa46f`, documentation HEAD `33e58b2`. Vitest/jsdom, English;
no browser viewport or RNG seed is involved in deterministic stat composition.

1. Create an Amazon fixture at level30 with native fresh equipment derivation,
   life31/mana17, empty priority, and no allocated passive.
2. Call the production `playerToCombatUnit` factory to capture the baseline.
3. Allocate rank1 or20 of Critical Strike or Dodge. For Penetrate, retain the
   legal Critical Strike prerequisite and allocate rank1 or20 of Penetrate.
4. Call the same factory and compare the affected stat and unaffected fields.

Expected from `src/data/skills/amazon.json`: Critical Strike adds.01crit chance
per rank, Dodge adds.01physical dodge per rank, and Penetrate increases fresh
Attack by.03per rank. Native ordinary learning still enforces prerequisites.

Actual: Critical Strike remains.05instead of.06/.25; Dodge remains.10instead
of.11/.30; Attack remains80instead of82.4/128. The six positive assertions fail;
all six non-Amazon class controls pass. No passive changes resources or equipment.
Old fixed15%/25% and Penetrate accuracy descriptions conflict with authored JSON;
the design reconciliation is recorded separately before runtime changes.

## Evidence and root cause

`src/stores/amazon-passive-composition.test.ts` reproduces through the actual
factory. Command: `npm run test:related -- src/stores/amazon-passive-composition.test.ts`.
Exit1,6failed/6passed,18.76s (over the5s related-test budget).
Raw log: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-static-field-27sv3iop/amazon-passives/repro-red.log`.

`dataCatalog.ts` registers the passives as non-castable buff metadata, while
`playerToCombatUnit` composes fresh equipment and specific supported passives
but never consumes these three authored allocations. Adding executable passive
casts would fix the wrong layer. The source of the omission is the fresh hero
stat composition boundary. There is no workaround that makes these allocations
effective. Existing active Amazon skills remain separate behavior.

No production code has been changed at reproduction. The ongoing earned browser
batch serves the unchanged `6faa46f` build; its state must not be replaced by an
Amazon fixture or any diagnostic export.

## Resolution

The fresh player factory now composes the three JSON-authored passive bonuses
once, after equipment derivation. Exact schema validation, immutable tuning,
alias/rank/eligibility controls, native allocation/next-wave/reset/replay, actual
damage/crit/dodge and bilingual current/next display are covered. No save shape
or damage formula changes. [Validation and retained failures](../../docs/plans/evidence/d05-amazon-passives.md).
