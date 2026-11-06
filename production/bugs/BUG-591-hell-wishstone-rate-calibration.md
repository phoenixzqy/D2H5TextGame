# BUG-591 — Calibrate the earned Hell wishstone faucet

Status: fixed in working tree (uncommitted); candidate calibration only. Severity: Medium.
Owner: game-designer / level-designer; root implementation.

## Reproduction

Build HEAD `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`, production source hash
`560c14d931ba87527e20d43d5381584b73d6405abc9c4228b2bf7cbacc0ecc32`.
Engine-only Node24.21.0 diagnostic on WSL; viewport/locale not applicable.

1. Read the independently audited earned level70 HellFoothills sample parts,
   including the defeat:48admissions/286waves/1.6775090756combat hours.
2. Reuse its285victorious native spawn contexts, captured hero MF/currency find,
   and original defeat duration; publish no inventory or campaign changes.
3. Generate128 independent native enemy-ID/reward cohorts from label
   `p15-earned-hell70-reward-cohort-v1|independent-native-reward-contexts`,
   cohort0..127, one seeded PRNG stream per cohort and one draw per admission.
   Run the retained external driver; it executes457728 native kill reward rolls.

## Expected

`docs/design/gacha-spec.md` §2 targets approximately80wishstones/hour at L70
HellActV farming. Retained combat cadence is only a conditional calibration
context; active menu/decision time and representative build acceptance remain.

## Actual

Original earned sample:10wishes,5.9612/combat hour. Native reconstruction matches
all outcomes; its conditional probability of10or fewer is0.0014532. This rare
trace alone does not establish a bug or justify tuning.

Independent native cohorts: mean64.9540/combat hour, approximate95%mean interval
[60.0687,69.8393].86022 gate opportunities/1727hits give2.0076%, consistent
with the authored2%. The measured cadence exposes an under-calibrated candidate;
no probability or PRNG implementation defect is established.

## Evidence and remedy

Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`:
`p15-earned-hell70-income-attribution-v2.json`,
`p15-earned-hell70-reward-cohort-v1.json` and their declared drivers/policies/logs.
Native chance boundary: `src/engine/loot/currency-kill-chance.test.ts`.

Raise only the existing P15 tuning knob from0.020 to0.025. At the sampled
cadence the baseline mean projects81.1925/hour. Compare on the same independent
seeds, conserving every other reward, without new combat or retroactive grants.
No claim that this completes source-income/balance or six-hour pity acceptance.

## Validation

The existing authored-probability regression fails on0.020 after its target is
updated to0.025 (8pass/1expected failure), then54affected cases across5suites
pass after the JSON change. These include combined-source/once-only gates,
missing-TC, native publication, quest bypass, continuous batch coins, schema
rejection and idle behavior. Scoped strict types and explicit test-file lint
pass. The production loader validates the complete material economy.

Paired128-cohort native study: mean80.6534/combat hour, approximate95%mean
interval[75.5870,85.7199]; cohort p10/p50/p90=45.9014/77.4959/116.8399.
All457728pairs preserve nonwish item payloads/materials/currencies; every old
2% cohort total matches the retained baseline. Aggregate gate2146/86022=2.4947%.
No combat replay, inventory grant, price/pity change or historical-wallet rewrite.
Evidence: `bug591-green-v1.json`, `p15-earned-hell70-reward-cohort-v2.json`.
