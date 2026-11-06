# P15 — Five curse/arcane signature rows

Type: bounded catalog repair/provisional tuning;2026-10-30. BUG416/BUG087.
Root sole writer in existing claimed worktree; advisers read-only. Existing
private-v1 implementation authorization covers routine adoption. CI excluded;
Chromium works. No publication/dependencies/migration or schema/runtime changes.

## Exact change and rationale

Remove only generic melee fillers; retain native signature order and every
other field. Ordinary delivery remains melee, all five remain undead.

| Row | Attack/growth | Retained skills |
| --- | --- | --- |
| act1.ghost | 27.2/4.25 | Curse |
| act1.wraith | 32/5 | ManaRift |
| act2.greater-mummy | 32/5 | FireBreath,Curse |
| act2.horadrim-ancient | 35.2/5.5 | FireBreath,Curse |
| act4.oblivion-knight | 35.2/5.5 | BoneSpirit |

Provisional light/standard/agile coefficients extend prior reviewed families;
no balance acceptance. Inventory becomes83authored/28pending (27boss/special
plus StygianDoll). Exclude Doll: its death trigger requires separate runtime
work. Do not alter native payloads, formulas, targeting, RNG or other content.

## Native rules, caveats and acceptance

Ghost1780ms Curse/ordinary; Wraith1700ms Rift/ordinary; Knight1700ms
BoneSpirit/ordinary with500ms flight. Greater1700/Horadrim1740 alternate
Breath/Curse, covering ordinary unless actual ManaBurn suppresses spells.
Curse is all-enemy arcane0–0 with minimum1hit damage and3000msAmplify,
reducing physical resistance50points; not JSONsingle/CD4/ManaBurn. Ghost
ordinary74→111 under Amplify against unmitigated noncrit target. Rift is
10–20all-enemyarcane/CD3, indefiniteManaBurn; native20%HPdamage drain/cappedMP,
arcane×1.2 and zeroMP×1.5 combos remain. Actual gain clears ManaBurn. Spirit
40–60/CD2. Ghost has no mana drain; Greater no resurrection; Knight no Curse.
Ghost/Wraith authored poison100 resolves75 via factorycap, not immunity.

Tests: literal curves/tier/level/delivery, unchanged nonattack/factoryRNG,
actual cadence/signatures/damage/projectiles, ManaBurn ordinary fallback,
Curse all-target/Amplify ally benefit, Rift resources, immutable/plain/replay.
Pin six GreaterMummy native challenge sources and five Knight sources using
source.waveId, full ordered roster/tier/provenance, plus IzualL49 oneIzual+
twoKnights allboss (KnightAttack479). Greater in LostCityW1/W4, ArcaneW2/W4,
TombW1/W3; Knight in PlainsW2, CityW3, RiverW3, ChaosW1/W4. Ghost/Wraith/
Horadrim have no literal authored consumers; no inference about dynamic use.
No explicit quest/endgame sources for five rows. Mixed Greater+Mummy verifies
actual Ignite/Amplify combos without crediting native source checks as earned
viability. No player-facing localization change.

## Frozen diagnostic and finish

Single2400fights/arm: five synthetic trash levels12/12/20/20/45; Greater22trash/
29elite and Knight49boss/58elite native-level isolated components; unchanged
L12Tainted/DarkArcher/Disfigured controls.12specs×2starting-stat unequipped
BasicBarbarian/FireBolt1Sorceress×100seeds0–99, allunspentstats. Native60s/
1000actions,600swall/256MiBcompressed. Full raw/metrics/hash/source provenance,
subject histograms versus teamperiodicDPS, A/B/A/plain checks,600exactcontrols.
Only enemyAttack/range/order normalized for pairing, never simulated. Exactly
five lists/pairs; all other source/payload bytes preserved (newtest allowlist).
Covered Greater/Horadrim may lack ordinary; no fake gap. Report all24cells,
censored victoryTTKdenominators; no tuning/retry/favorableseed/reward/pacing/
earned acceptance. Final related validation/types/scopedlint, independentQA/
evidence review, exact owned cache/process cleanup; keep umbrella packet/claim.

Plan/root-cause review: ready; authored list fix addresses selector starvation
without selector workaround. Native caveats and all literal consumers bounded.
Security check: pass; local JSON/tests/owned diagnostics, no credentials/network/
permissions/newdependencies/publication. No additional confirmation required.
