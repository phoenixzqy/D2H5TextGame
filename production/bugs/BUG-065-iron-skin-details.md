# BUG-065 — Align Iron Skin details with allocated defense

- **Status:** Open; source and unchanged-production UI reproduction confirmed before patch. Browser pending.
- **Severity:** Medium — incorrect skill information and legacy/alias rank display.
- **Owner / affected systems:** frontend-dev, writer, qa-engineer; Skills detail and bilingual copy/spec.
- **Build:** `f1ef33f` (runtime `e234dad`, native `a4548e2`).
- **Environment:** Linux source inspection; planned Vitest/jsdom UI reproduction. No browser/viewport measured yet.
- **Locale:** zh-CN and en.
- **Seed:** Not applicable to static copy; seed7 planned for recording-preservation control.

## Reproduction

1. Read the authored `skills-barbarian-iron-skin` in src/data/skills/barbarian.json:
   requiredLevel18, maxLevel20 and defensePct0.04 per allocated rank.
2. Compare barbarian.iron-skin.desc in both skills.json locale files and the
   barbarian.iron_skin row in docs/design/skills-spec.md: each still promises
   fixed+100% defense. This source discrepancy is reproducible without a browser.
3. Inspect SkillsScreen allocatedSkills: the generic alias insertion/legacy
   fallback has no exact Iron Skin resolver override. Its dynamicDescription
   likewise has no Iron Skin authored-description branch.
4. Execute the separately reviewed bilingual UI test before patching to classify
   actual display failures and passing controls. No execution result is claimed here.

## Expected and actual

[D05](../../docs/plans/decisions/D05-iron-skin-v1.md) controls level18, +4% ordinary
combat defense per allocated rank, cap20/+80%. Current/next ranks must use the
maximum valid exact allocated alias once; legacy skills alone grant no rank.
Runtime already follows this contract. Static locale/spec text instead says
+100%, while the screen uses generic passive prose and generic rank resolution.
These source findings do not establish any new combat, save or balance defect.

## Evidence and correction

[Iron Skin evidence](../../docs/plans/evidence/p07a04-iron-skin.md). Root-owned
RAW at `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-iron-skin-c7fexii5`
contains independently reviewed stage-d-ui-draft-freeze-v1.json and five exact
UI drafts. Keep actual RED reports separate from this source-only reproduction.
Use the existing immutable definition/resolver for display, interpolate both
locale descriptions, and reconcile only the Iron Skin spec row. Preserve the
existing 钢铁之肤 name. No runtime tuning or generic passive refactor is needed.

## Workaround

Consult D05; actual allocated Iron Skin defense works in combat. UI/copy and
production-browser acceptance remain open until the bounded fix is validated.


## Actual unchanged-production UI reproduction

On `f80dd94`, the exact reviewed 20-case bilingual draft executes in jsdom:
12 failed/8 passed, exit1, no stops/signals/pending/todos. All four production
source/copy/spec hashes remain at the frozen baseline. Each locale fails six
cases: missing authored prose; legacy rank inference; order-dependent alias
rank19→1; displayed rank99/20 despite capped80% potency; fractional rank treated
as learned; near-miss identifiers normalized into allocation. Reverse alias
order, invalidNaN+validalias, real17→18 allocation and recording/resource controls
already pass. Existing generic numeric current/next4/8 and level18 are controls;
there is no claim every assertion failed. Hard failures prevent later assertions
in their cases from executing. Retain full JSON, not only these summaries.

RAW records: `focused-iron-ui-red-report.json`, its log/meta/process records,
`stage-d-ui-baseline-freeze.json` and `stage-d-ui-red-classification.json`.
The independently approved source/copy correction has not yet been applied.
