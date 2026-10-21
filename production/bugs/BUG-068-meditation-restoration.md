# BUG-068 — Implement selected Meditation mana restoration

- **Status:** Fixed — bounded D05 selected-Meditation path; independent GD/TD/QA/producer acceptance.
- **Severity:** High — the advertised Meditation recovery path cannot be selected.
- **Owner / affected systems:** engine-dev, frontend-dev, writer, qa-engineer; authored skill contract, aura selection/save, exact combat recovery and bilingual detail.
- **Reproduction baseline:** `a188810`; retained historical source-only report below.
- **Fix sources:** definition `3ba7ad4`, save11 `8a79356`, selection `c65b663`, exact primitives `f4bcb8a`, combat `b478a56`, native `c09cbe8`, UI `10c051f`, spec `f575986`, browser `72731b0`.
- **Environment:** Linux read-only source inspection; no browser viewport or runtime scenario executed for this report.
- **Locales:** zh-CN and en.
- **Seed:** Not applicable to this static reproduction; later deterministic combat tests must record their actual seed.

## Historical reproduction at a188810

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


## Resolution and regression coverage — 2026-10-21

[D05](../../docs/plans/decisions/D05-meditation-v1.md) defines the source-baseline
denominator and exact interval settlement. One explicit None/Might/Meditation
slot survives validated save11; learning never selects, and replacement never
stacks or refills. Hero and original living fielded merc receive the source bonus
with independently retained recipient baseline. Bilingual copy replaces5mana/turn.

[Evidence](../../docs/plans/evidence/p07b03-meditation.md) maps definition/schema,
historical/current save, store, precision/death/cap combat, native/replay and UI
regressions. `tests/pwa/meditation.spec.ts` verifies native learning/keyboard/
selection, all9CSSsizes in each locale, explicit save/newPage equality and real
rendered hero mana/cast consequence. Final units5424/200files/types/lint and
production browser2/2 pass;36screenshots independently reviewed. Earlier actual
font-environment and incorrect-test-literal failures remain in the evidence;
imported eligibility/ranks/stats are explicit scaffolding.

This fixes this advertised path; full P07b, browser mercenary behavior, earned
campaign, allbrowser/touch/fulla11y/performance and balance/private-v1 remain open.
The historical workaround above describes the pre-fix baseline only. RAW remains
root-owned until durable packet verification and exact cleanup receipt.
