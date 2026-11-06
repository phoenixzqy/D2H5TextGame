# BUG-693 — Select owned physical upgrades for intended Bow

Status: Resolved locally, uncommitted; preparation regression and earned Ancients/Baal completion verified.
Severity: High (intended build progression); owner: root / game-designer.

## Reproduction

Working tree based on `b5a0898806bfba369a2d84a1b6c41d0bbb057fce`.
Native Node campaign; browser, viewport and locale not applicable.
Ancients admission913, runSeed3358914130, wave7, battle seed2612045189.

1. Continue the earned intended Bow Act IV successor52/next910 with its
   declared owned-equipment policy and native inventory.
2. Observe the recorded weapon decisions before the Ancients admission.
3. Inspect the final wave and stopped successor52/next914.

Expected: this physical weapon build considers eligible owned bow/crossbow
upgrades by the existing physical-offense policy while preserving weapon type,
native requirements, resource/point budgets and item custody.

Actual: its profile omits `heroWeaponPolicy`. The generic clear-upgrade test
rejects every weapon that loses any defense stat. Its equipped attack22 bow
contains two flawed diamonds. Eligible owned Rogue's Bow `it-9piss-dx5`
raises attack200→364 and speed242→272, but loses8magic resistance and is
rejected despite positive net score186. No weapon is selected. The final
Ancients wave draws60s with one enemy at3399HP, hero1123/1123HP and213mana
(minimum188). Earlier24waves win; Baal remains unattempted.

## Evidence and root cause

Packet: `/home/felixzhao/.zai/profiles/anonymous/zai-temp/d2-counted-source-z3jj3xa1`.
Prefix `p15-bow-post-priority-act5-v1`, retained `gear-decision` weapon rows
and final `settled-wave.engineInput` in `.journal.jsonl.gz`.
Native export SHA256:
`078bd8b027e84d47472e16e352afd69dfca3dec96abdcafadc6a7e0e1c20e74b`.
Readback and process/source/cleanup closure pass without combat replay.

`tests/campaign/intended-profiles.ts` declares physical hero preparation for
five other intended identities, but only weapon mutex/volley order for Bow.
`tests/campaign/actions.ts` therefore falls back to
`src/features/inventory/compareEquip.ts:isClearNetUpgrade`, which refuses any
negative stat delta. The existing physical policy already compares actual
attack, critical chance/damage and capped action cadence. The defect is the
missing profile opt-in, not evidence that combat or loot formulas need tuning.
The earned corrective suffix below verifies the Ancients clear after correction.

## Scope and limits

Affected systems: campaign preparation (game-designer / QA). Reuse the
existing physical policy from level1, when the build already uses weapon
damage; retain bow/crossbow and all other policies. Add focused native
selection/custody regressions before changing the profile. No resources or
items are gifted and no historical admission/training allowance is reset.
Original Act IV training and failed Ancients admission remain consumed.
Formal balance0/210 and full privatev1 acceptance remain open.

## Correction and verification — 2026-11-04

Intended Bow now declares `heroWeaponPolicy: { kind: 'physical-offense-v1',
level: 1 }`, retaining native bow/crossbow and offhand constraints. Five
selected equipment regressions pass, including early stash selection, the
actual Rogue's Bow definition at52, crossbow selection, native requirements,
custody/economy/points conservation and idempotence. Scoped strict types and
explicit lint pass. The expected RED, initial incorrect level-lock fixture
and initial lint failures remain retained; corrected checks were not broadened.

Closure prefix `p15-bow-physical-weapon-v1`, SHA256
`7b92aa3d4e1fa31b3fb45ccf9cb650520fe8d37d0a9711372df67a36eed0f4d4`,
verifies all2204production inputs unchanged, exactly two campaign files changed,
all recorded processes absent and the disposable type config removed. No native
admission executed during the preparation correction itself.
See [current Bow evidence](../../docs/plans/evidence/p15-bow-post-priority-and-owned-weapon.md).

The subsequent `p15-bow-owned-weapon-act5-suffix-v1` continues the actual
52/next914save: corrective Ancients914 wins seven waves, then first Throne915
wins eight. Terminal53/next916 completes all19ActV actions, exact saved rewards,
Baal title and Nightmare unlock. Frozen retained reader and separate closure
pass; no earlier replay, training renewal, formula change or additional retry.
Closure SHA256 `43e775db9d443d25eb9e45582432b8c75f795a91eec1c1e9fd84fffdb39e4c1c`.
All20recorded wrapper/child PIDs and exact transient cache/config are absent.
This establishes one earned build completion, not broader balance/pacing acceptance.
