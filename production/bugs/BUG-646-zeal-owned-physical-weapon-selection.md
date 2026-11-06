# BUG-646 — Select owned physical upgrades for the invested Zeal build

Status: Open; sole frozen candidate rejected after exact control reproduction.
Severity: High (intended build progression); owner: root / game-designer.

## Reproduction

Working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`;
exact production/campaign manifests retained in `p15-zeal-earned-act4-v1.json`.
Native Node campaign in WSL; browser/viewport/locale not applicable.

1. Continue the verified Zeal Act III level47/next683 save with the unchanged
   intended profile and native Act IV controller.
2. Reach level49 and attempt Plains of Despair at ordinals711,712,713.
3. Inspect the final weapon decision and retained wave5 at ordinal713,
   runSeed118985851; wave seed is uint32(runSeed XOR (5 * 0x9e3779b1)).

Expected: an invested weapon-damage Zeal build can choose a materially stronger
owned eligible weapon while accepting an explicit defensive tradeoff.
Actual: all three Izual battles draw at60seconds. Hero survives with935HP and
ample mana, while Izual retains11773/3809/10118HP. Generic net-upgrade eligibility
rejects stronger owned weapons if any compared defensive stat falls. The hero
keeps Torch of Iros wand `it-89hvd-2m9`, attack212/speed183. Owned eligible
Razor Stitch polearm `it-4hncc-dot` projects attack377/speed193, at the cost of
shield displacement,22defense,4magicResist,42manaMax and other resistances.

## Evidence and diagnosis

[Verified checkpoint](../../docs/balance/2026-11-03-zeal-act4-checkpoint.md).
Packet `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-zeal-earned-act4-v1`: native report/journal/save and passing V1 reader.
Last weapon decision has121candidates and selects none. The polearm's native
attack/cadence/critical estimate is about93%higher than the wand's, before enemy
mitigation. This is a profile-policy defect, not an established production
damage defect. Existing `physical-offense-v1` already supports such tradeoffs,
but only the Corpse profile opts in; intended Zeal does not.

Affected systems: intended campaign profile, owned gear selection and regression.
Manual workaround: equip the owned eligible physical weapon through inventory.

## Frozen diagnostic and adoption rule

One control and one candidate on the single retained ordinal713 wave5 input.
Control must exactly reproduce all events and terminal teams, including native
Might projection. Candidate uses the existing physical-offense policy at Zeal's
level12 unlock on the complete native49/714 save. Project only native gear-driven
unit-field differences into the retained battle; preserve cooldowns, party,
statuses, enemies, seed and rank allocations, clamp resources to changed maxima.
Record every gear movement and require custody/economy conservation. Require a
living-hero candidate victory before adoption. No second candidate, seed search,
earned route clear, budget renewal or campaign replay. Failures remain retained.

## Completed comparison — 2026-11-03

[Decision/evidence](../../docs/balance/2026-11-03-zeal-owned-weapon-comparison.md):
exact original control and one native owned polearm candidate consume the full
two-battle diagnostic. Izual remainingHP10,118→2,415, still a60s draw with living
hero935HP/489MP. Adoption condition fails; no profile correction or earned retry.
V1 setup failed before combat; corrected V2 whitelist permits both native regen
fields, with candidate/input unchanged. Scoped types/lint/preflight pass; all
2,151production/131campaign inputs authenticate unchanged. Cache/config absent;
required evidence/closure retained by root through umbrella review. Static
damage/cadence inspection found no established production defect. No further
weapon/order candidate on this snapshot. Continue other required work.
