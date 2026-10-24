# D11 — Summoner durability calibration

2026-10-24. Root numeric reconciliation; independent design/source/QA acceptance
pending. Local implementation candidate under the existing full-v1 goal.

## Diagnosis

BUG146 separates lethal unadapted caster packs from the boss deadline. Legal
owned defensive body equipment approximately doubles projected magic effective
HP while preserving attack/speed/crit. Fixed control-first trash and original
Ice-Blast-first boss order reach Summoner59/64 but win only5/64. Rank1 Blizzard
does not improve the decomposed32-seed results; retain the real unspent point.

Generated Summoner is28: area23 + difficulty1 + boss offset3 + half authored
spread2 =28. Base780–980/growth78–98/native3× yields8658–10878HP. Earlier
informal27/8424–10584 descriptions were wrong; actual recorded HP and the
production planner are authoritative. Median observed boss damage6618 and
p10damage5347 motivate an attainable non-chapter-boss life envelope under the
existing60-second cap, while retaining elemental50% and independent MR81.

## Frozen candidate and boundaries

Only `monsters/act2.the-summoner` life changes:

| Knob | Previous | Candidate |
| --- | --- | --- |
| life |780–980|450–550|
| lifeGrowth |78–98|45–55|

Normal28 envelope4995–6105HP, about44% lower; Nightmare48 envelope7695–9405HP
through the existing+20-level rule. This supersedes these two authored knobs;
no prior approval of these numbers is implied. Damage/formulas, tier factors,
resistance/MR/defense, spells, three ordinary flayer guards, XP/loot, source
credit, map levels and deadline remain unchanged. No save/skill/caller patch.

## Implementation and verification

Security check: **pass**, scope local JSON tuning, production-data regression,
bounded native simulations and ordinary browser continuation; no credential,
network, permission, dependency or workflow-bypass change. No findings.

Plan review: **ready**, root self-review. Preserve exact genuine input/ordinal,
separate setup/pack/boss failures, freeze one candidate before outcomes and
retain diagnostic-only assumptions. Two regressions must reject the old data,
verify native28 plus three guards, validate schema and prove only life differs
at28/48 with identical subsequent RNG. Existing issued recordings stay frozen.

Before/after native seeds1–64 use the same defensive loadout and fixed policy;
screen1–32/replay group33–64 are kept separate. Both groups were inspected
before choosing life values: the historical `holdout` JSON label does not make
group33–64 an unobserved certification sample. Local candidate target: ≥80% full-area
wins in each group, victory boss p50≤50s/p95≤58s, no increase in deaths. Every
non-boss wave pair must have identical outcomes/timing. These local targets do
not accept the broad all-class balance contract or imply retry probabilities.

Also capture1000 isolated boss-wave battles per revision with the same prepared
gear/order, full native resources, actual planner guards/levels and fixed1–1000
seeds. Label that optimistic resource assumption. Compare wins/deaths/TTK and
retain failed rows. It is not a substitute for full-area native carry or the
required on-level/BiS × all-class/build/difficulty grid.

Validate focused/engine/full unit, typecheck/lint and bridge-free production
build. Then one ordinary production continuation from actual next257, no supplied
seed/debug bridge/Skip/resource injection, with exact legal defensive equips and
fixed priority policy. The ordinary Skills editor refreshes the current wave;
therefore switch priority only before the initially paused sixth wave plays,
not while the fifth recording is pending. Three paired native seed controls
must prove its complete six-wave recordings match next-wave preparation.
This is one declared pre-play configuration refresh, not retrying a failed
outcome or another challenge entry. Stop at the first nonwin; retain prefix rewards and actual
next ordinal. On success require qualified Summoner kill, explicit journal Read,
separate Claim and exact Save-close-new-page Continue. No replay of257.

Full fresh-current earned ActsII–V/C2, seven classes/213 skills,30–50active-hour
pacing, broad balance and C3–C4/G0–G7 remain open. This is one progression fix.
