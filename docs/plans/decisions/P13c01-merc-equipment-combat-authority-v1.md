# P13c01 v1 — Mercenary equipment combat authority

Status: bounded A plan/final frozen RED independently APPROVE by producer/QA;
runtime validated and producer/QA final APPROVE; bounded A accepted. Inputd8f1c23.
Root owns all writes in claimed human worktree2; reviewers are read-only.
P03b05a/b transfer/integrity acceptance remains valid. Full P13/C/G remain open.

## Composition and authority

Canonical mercEquipment[ownedFieldedMerc.id] contributes when creating a fresh
combat run. Select owned merc and its map from one mercStore snapshot. Ignore
legacy merc.equipment, hero equipment, other merc maps and stale caller payloads.
Preserve existing transfer eligibility/capacity/requirements/handedness behavior.
No new equippedWeapon metadata or skill gating in this increment.

Saved owned derivedStats S is the unequipped authored/grown baseline; do not
replace it by deriving current core/level. Existing addExperience changes core
and life but leaves attack/defense/speed/mana/dodge unchanged. Freeze delta policy:

```
M = aggregateEquipmentMods(canonicalMap)
B = deriveStats(owned.coreStats, owned.level)
G = deriveStats(applyEquipmentCoreMods(owned.coreStats, M), owned.level,
                equipmentModsToDerivedModifiers(M))
effective[k] = S[k] + (G[k] - B[k])
```

Apply to every nonresource scalar, maxima and each resistance. Zero delta
preserves the saved value exactly; return fresh stats/resistances and mutate no
inputs. Empty/null-only/unsupported/effectively-zero gear must preserve baseline.
Changed speed receives final Math.max(1, composedSpeed); zero-delta speed stays
exact, including legacy values. No other final clamp/legacy repair. Use shared
rounding, soft cap200 and saturation500, preserving raw core above500.

If a maximum changes, projected current pool=Math.min(savedCurrent,effectiveMax).
If unchanged, preserve current exactly. No refill, proportional scaling, lower
clamp or persistence of projections. Adapter top-level fresh-run life/mana still
start at effective maxima, matching current policy. Existing recordings/carry
retain merc config/resources: equip/unequip affects next fresh run only. No
mid-run refresh, resurrection, healing or saved baseline/growth/schema changes.

## Supported contributions and limits

Reuse existing aggregator: baseRolls, modern rolled affixes, legacy Map paths,
unique/set packages with persisted rolls and set thresholds, zero RNG draws.
Keep its duplicate-ID/unknown-base/unsupported-path semantics unchanged.
Core4→derived delta; flat life/mana/attack/defense/speed, chance/dodge fractions,
crit multiplier, raw resistance percentage points and MF/GF pass through.
Shared damageBonus paths retain existing flat-attack conversion. No new percent
life/attack/defense, granted skills, sockets/runewords or elemental attack rules.
Merc MF/GF projects but current rewards still consume hero MF/GF.

Existing named skills use registered effect ranges. Basic Arrow remains15–25
(registry, not differing JSON). Sword attack affects basic fallback only, not
Basic Arrow/Jab/Pierce Arrow ranges. No new universal weapon bonus, data tuning
or claim that this fixes the archived Den defeat. Defensive stats, crit and
speed reach their existing engine consumers.

## Independent literal oracles

Real InnerSight rogueL3 + real2730XP→L6, XP1043/1336;
core15/31/16/17. Saved unequipped lifeMax172,manaMax79,attack25,def26,speed122,
crit.05/mult2,physicalDodge.094/magicDodge.05,MF/GF/resists0. Controlled saved
current pools160/60. Sword wp1h-short-sword baseRollattack7 (catalog8),
cap helm-cap baseRolldefense6 (catalog7).

Rich gear adds cap legacy Map paths: coreStr5/Dex3/Vit2/Energy2;
statMods life10/mana5/attack4/defense3/attackSpeed5/critChance.10/
critDamage.25/physDodge.01/magicDodge.02/magicFind15/goldFind7;
resistances all5/fire10/lightning20. Effective calculation core20/34/18/19.

| Value | None | Sword7 + cap6 | Rich |
| --- | ---: | ---: | ---: |
| lifeMax | 172 | 172 | 186 |
| manaMax | 79 | 79 | 87 |
| projected life/mana | 160/60 | 160/60 | 160/60 |
| attack | 25 | 32 | 38 |
| defense | 26 | 32 | 35 |
| speed | 122 | 122 | 130 |
| crit chance / multiplier | .05/2 | .05/2 | .15/2.25 |
| physical / magic dodge | .094/.05 | .094/.05 | .11/.07 |
| MF/GF | 0/0 | 0/0 | 15/7 |
| fire / lightning resist | 0/0 | 0/0 | 15/25 |
| other resists | 0 | 0 | 5 |
| fresh unit life/mana | 172/79 | 172/79 | 186/87 |

Fixed landed noncritical lightning70/no combo/penalty gives44→38→17 damage.
Basic fallback vs zero mitigation/hit/noncrit25→32; registered Basic Arrow
forced base20 stays20→20. Real recorded seed0/one enemy/crit0 control
uses hit draw.2664 and range draw.000329→base15: named15→15, fallback25→32. Projected rich saved current180/85 stays180/85;
removing gear preserves original saved180/85 because zero delta preserves saved
current even above max; fresh adapter top-level pools still fall to172/79. Never
feed a prior equipped projection back as S. A separate negative gear life−20/
mana−10 on saved current160/75 yields max152/69 and projected current152/69;
this proves clipping when maxima differ, without repairing legacy overflow.

Separate L1 current-derived baseline with otherwise-zero core freezes caps:

| Raw Dex / gear | Speed | Attack | Phys dodge |
| --- | ---: | ---: | ---: |
| 199 / none | 299 | 109 | .448 |
| 199 / +3 | 301 | 110 | .452 |
| 499 / none | 449 | 184 | .749 |
| 499 / +5 | 450 | 185 | .750 |
| 501 / none or +5 | 450 | 185 | .750 |

L6 speed122 vs canonical131 with gear speed−500: G.speed1, composed−8→final1;
unequip restores122. Zero-delta gear preserves malformed baseline speed unchanged.
This pool-oracle correction follows independent producer/QA plan review; the
original contradictory proposal is retained in task RAW plan review history.
Fractional expected values use close assertions for IEEE754 only; integer/payload
oracles remain exact. No formula/threshold weakening.

## Delivery and validation

First existing-path regression exercises real equipOnMerc→startSubAreaRun→
initial playerTeam with explicit seed, unrelated hero/other-merc/legacy decoys and
stale requested payload. Missing-helper import alone is insufficient repro.
Record genuine RED and structured BUG046 before runtime; freeze full tests and
report hashes for independent producer/QA approval.

Five code files: new engine/progression/merc-equipment-stats.ts and test;
stores/mercToCombatUnit.ts, stores/combatHelpers.ts and new
stores/merc-equipment-combat.test.ts. Helper tests remain pure engine;
adapter/caller tests use real stores/factory/transfer/recording/damage engine.
Cover repeated composition/swap/removal/growth/no accumulation, input/output
isolation, resource pools/maxima, same recorded input/events after gear change,
wave carry unchanged and next fresh-run authority. Decision/BUG/evidence and
closing ledger are separate documentation.

Focused GREEN, engine, related, full unit/coverage, TSC/lint/purity and production
bridge/build; no concurrent build/fingerprint tests or threshold weakening.
Exact task RAW/dist/.vite cleanup after independent consumers release. Later B
requires reviewed ordinary earned gear/equip/combat/Save/reopen recipe, pilot and
locale/mobile matrix. A accepts no Den retry, balance or broader progression.

## Frozen RED approval before runtime

Producer and QA independently approved final amended RED before runtime edits:
36 tests, 33 failures (24 missing helper feature cases, 9 genuine existing
adapter/caller failures), 3 passing controls, 0 pending/todo, exit1/4.456s.
Report SHA2567590fc6a17bcf8efc5b5c40a9779410bb30a74c0a1346d732019db21a4ed1f33.
Helper SHA256aa8435710cad33e5bb4f563d444b3f08d4fffac7a7a59955490b553f94ab3166;
store SHA2565e6732f35593c4790d1d72d0d3b437ec17e520386dd83e183e815595af804a9a.

The final added case freezes noncanonical saved fire30/cold−50/crit.2/mult1.5/
MF9/GF4 + gear10/5/.1/.25/15/7 =>40/−45/.3/1.75/24/11. This distinguishes
S+delta from replacing those fields with freshly derived G. Original cases and
previous freezes retained; no prior numeric assertions changed. Earlier fixture
type corrections use NonNullable baseRolls and empty ignored signatureSkillId
rather than explicit undefined under exactOptionalPropertyTypes. Lint removes
redundant damage-kind check already guaranteed by find predicate. Typed TSC
10.715s/scoped lint5.887s passed; these amendments did not change the oracles.

Final A source/evidence APPROVE/ADEQUATE; all independent RAW holds released
before exact cleanup/verified absence. Evidence: ../evidence/p13c01a-merc-equipment-combat.md.
The single stale healing identity assertion is the independently approved sixth
code file; no existing healing numeric/timing/loadout oracle changed.
