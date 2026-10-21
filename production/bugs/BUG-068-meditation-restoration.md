# BUG-068 — Implement selected Meditation mana restoration

- **Status:** Source-reproduced; contract and regression tests pending.
- **Severity:** High — the advertised Meditation recovery path cannot be selected.
- **Owner / affected systems:** engine-dev, frontend-dev, writer, qa-engineer; authored skill contract, aura selection/save, exact combat recovery and bilingual detail.
- **Build:** `a188810`.
- **Environment:** Linux read-only source inspection; no browser viewport or runtime scenario executed for this report.
- **Locales:** zh-CN and en.
- **Seed:** Not applicable to this static reproduction; later deterministic combat tests must record their actual seed.

## Reproduction

1. Inspect `src/data/skills/paladin.json:294`: exact player Meditation is an aura/passive/self skill, unlock24 with Cleansing prerequisite, cap20 and manaRegenPct0.03 per rank.
2. Compare `docs/design/skills-spec.md:116` and both locale descriptions: they promise5mana/turn for self and mercenary.
3. Inspect `playerStore.selectAura`: only null and paladin.might requests are supported; Meditation returns unsupported-aura by this explicit branch.
4. Inspect Player.selectedAuraId, current save validation, SkillsScreen selector and combat snapshot/projection/settlement: only Might is supported; no Meditation contribution enters mana recovery.

This is a source reproduction, not an executed store/engine/browser failure. A genuine reviewed behavioral RED precedes each later runtime correction.

## Expected

P07b requires an actual selected Meditation aura that restores bounded mana, has truthful strength/recipients/suppression and can replace Might/None without stacking or permanent resource/stat mutation. Resolve the percentage denominator and exact interval semantics in a controlling D05 before code; neither percent-maxMana nor fixed5mana/turn is established by the authored coefficient.

## Actual and root cause

Authored data and old prose advertise different recovery semantics. The current intentionally narrow Might-only selection/save/runtime path provides no Meditation choice or restoration. A mercenary's current baseline is zero, so merely multiplying each recipient baseline would not fulfill the advertised mercenary scope. Existing exact per-second recovery is available for reuse; no baseline recovery defect is inferred here.

## Evidence and next steps

Source baseline/fingerprints and independent GD/TD/producer audit are retained at root-owned RAW `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2h5-root-meditation-k9g_jrtv` until durable verification/exact cleanup. See `docs/plans/work-plan.md` P07b and D05-selected-might-aura-v1/D05-warmth-recovery-v1. This report precedes all Meditation source changes. Contract, schema/helper, historical-save preparation/cutover, selection, exact contribution/runtime/native and truthful UI/browser are separate bounded increments.

## Workaround

None restores Meditation. Keep the existing None/Might choices; this does not satisfy the missing recovery feature. No full P07b, balance, earned campaign or private-v1 acceptance is claimed.
