# BUG-666 — Select owned offensive weapons for intended Javelin

Status: Fixed locally; native selection/accounting verified with a failed prospective weapon prediction. Boss viability remains unverified.
Severity: High (intended build preparation). Owner: root / game-designer.
Environment: native campaign, retained working tree based on b5a08988; browser,
viewport and locale not applicable. Engine seed84330382 authenticates the
preceding Diablo failure; this preparation issue does not require combat.

## Reproduction

1. Restore the exact earned `p15-javelin-post-priority-act4-v1.native-export.json`
   from the retained counted-source packet; level49/next706.
2. Inspect canonical equipment and the unchanged intended Javelin profile.
   It equips level9 unique Skewer sword `it-2zuj8-2p9` (base Attack12).
3. Inspect already owned backpack War Fork `it-e0ki-r6v` (level48, Attack59).
   The profile has no `heroWeaponPolicy`, so its native comparisons require
   all-stat nondecrease rather than considering physical offensive tradeoffs.

Expected: after Impale's native level12 unlock, Javelin can choose stronger
owned physical weapons under the same explicit offense policy already used by
other weapon builds, with native eligibility, two-hand displacement and exact
owned custody. Before that boundary retain current preparation.
Actual: no offense policy is declared; defensive/socket tradeoffs can prevent
useful weapon upgrades. Impale supplies28454direct damage in the failed Diablo
fight while the hero remains healthy. No native equip or damage-formula defect
is established, and the owned War Fork is not proof of a winning fight.

## Scope and evidence

Use existing `physical-offense-v1` without adding a weapon-family restriction,
new item, rank, resource, reset or drop. Keep signature order and all learned
fillers: the sole signature-only diagnostic is rejected (Diablo1067HP at60s).
Affected files: intended profile, JSON activation level and focused equipment
regressions. Prove offensive tradeoffs at12/49 and unchanged behavior below12,
then one zero-combat preparation on a disposable copy of the exact native save.
Any refused action remains recorded; no route replay or allowance renewal.

Required packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`,
prefix `p15-javelin-owned-weapon-v1`. Preserve original native export SHA256
`3de36dbd5a4ec9b7d241abe17daa7b4910282d01e0a7e4547190bdb75237074d`.
Preparation success alone grants no Act IV clear, earned acquisition claim or
formal balance acceptance.

## Correction and verification, 2026-11-04

The intended profile opts into existing physical-offense-v1 from JSON level12.
No affinity, combo, rank, production formula or item data changes. The focused
RED reproduces the absent policy and rejected offensive tradeoffs at12/49;
all43equipment cases pass after correction. Final scoped strict types and
explicit equipment/diagnostic lint pass. Initial type/config/matcher and
diagnostic-lint failures remain retained; none was suppressed.

One bounded native preparation from the exact49/next706save stages52items and
equips owned unique Razor Stitch polearm it-8bri0-ddh. The launch then fails its
prospective assertion expecting War Fork it-e0ki-r6v; it is not restarted and
the second/idempotence call is not reached. The mistaken prediction is not a
native refusal: separate readback verifies all candidate scores and ranking,
and the selected polearm is the maximum under the unchanged policy.

Attack265→395, AttackSpeed226→236, Defense388→343, MagicResist40→32;
current Life140/Mana72 remain exact. All437owned payloads and the entire save
after each53native actions reconcile; no combat, income, time advancement,
quest/progression changes or renewed allowance. Unit idempotence passes;
idempotence on this retained save remains unverified. Original and actual
successor exports, failed launch, audit and costs remain in the packet.
See [combined evidence](../../docs/plans/evidence/p15-javelin-act4-and-owned-weapon.md).
